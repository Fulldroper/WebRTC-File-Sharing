console.clear();

window.onload = async () => {
  const input = document.querySelector("input.file-input");
  const status = document.querySelector("li.connection-status");
  const MyDir = document.querySelector("li.shared-list");
  const MyID = document.querySelector("li.connection-id");
  const shFiles = document.querySelector("div.shared-files > ul");
  const hHFiles = document.querySelector("div.hosted-files");
  const hFiles = document.querySelector("div.hosted-files > ul");
  const defaultPage = document.querySelector(".default-p");
  const downloadtPage = document.querySelector(".loading-p");
  const parsed = window.location.hash.slice(1).split(":");
  const HostID = parsed[0] || false;
  const FileID = parsed[1] || false;
  const peer = new Peer();
  const myURL = `${window.location.protocol}//${window.location.host}`
  const saveData = (function () {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.visibility = "collapsed";
    return function (data, type, fileName) {
        const blob = new Blob([data], {type}),
              url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
  }());
  
  if (FileID) {
    defaultPage.style.display = "none";
    downloadtPage.style.visibility = "visible";
  }

  peer.on("open", (id) => {
    status.innerText = `Status: Online`;
    status.style.color = `green`;
    MyID.innerText = `ID: ${id}`;


    MyDir.innerHTML = `<a href="${myURL}#${id}" style="dis">[ All files ]</a>`;
    
    input.onchange = ({ target }) => {
      for (const file of target.files) {
        const FE = document.createElement("li");
        FE.innerHTML = `<a href="${myURL}#${id}:${file.name}">${file.name}</a> ~ ${file.size}`
        shFiles.prepend(FE)
      }
    };

    if (HostID) {
      let conn = peer.connect(HostID)
      conn.on('open', () => {
        conn.send({ FileID })
      });
      conn.on('data', (answer) => {
        if (answer?.list) {
          hHFiles.style.visibility = "visible";
          answer.list.forEach(f => {
            const FE = document.createElement("li");
            FE.innerHTML = `<a href="${myURL}#${HostID}:${f.name}" target="_blank">${f.name}</a> ~ ${f.size}`
            hFiles.prepend(FE)
          });
        } else {
          const {name, type, size, data} = answer
          saveData(data, type, name)
          console.log(answer);
        }
      })
    }
    
    peer.on("connection", (conn) => {
      // Receive messages
      conn.on('data', function({FileID}) {
        if (FileID) {
          for (const file of input.files) {
            if (file.name === FileID) {
              const FR = new FileReader()
              const {name, type = "", size} = file
              FR.onload = (event) => {
                conn.send({
                  name, type, size,
                  data: event.target.result
                });
              };
              FR.readAsArrayBuffer(file);
            }
          }
        } else {
          const list = [];
          for (const file of input.files) {
            const {name, type = "", size} = file
            list.push({name, type, size})
          }
          conn.send({list})
        }
        conn.send()
      });
    })
  });

  peer.on("close", () => {
    status.innerText = `Status: Offline`;
    status.style.color = `red`;
    MyID.innerText = `ID: none`;
  });
};
