window.AudioContext = window.AudioContext || window.webkitAudioContext;

const Meow = (() => {
    const button = document.getElementById("meow_button");
    const name = ["First cat", "Second cat", "Third cat", "Fourth cat", "Fifth cat", "Sixth cat", "BigOrange"];
    const getAudioAddr = () => {
        const int = Math.ceil(name.length * Math.random());
        const addr = "../meow/voice" + int + ".mp3";
        return [int, addr];
    }
    const playAudio = (buffer, context, number) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onended = () => {
            button.innerHTML = "Click here to play the MEOW～";
            context.close();
        }
        button.innerHTML = `${name[--number]} is meowing!`;
        source.start();
    }
    return () => {
        var context = new AudioContext();
        const info = getAudioAddr();
        const xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.open("GET", info[1]);
        xhr.onload = () => {
            context.decodeAudioData(xhr.response, (buffer) => {
                playAudio(buffer, context, info[0]);
                context = null;
                console.log(context);
            });
        }
        xhr.send();
    }
})();//callback loading?

const Cite = (() => {
    var counter = 0;
    const citationArea = document.getElementById("citation");
    const elementOf = (text, flag) => {
        const element = document.createElement("div");
        element.innerHTML = text;
        if (flag == "resolved") {
            element.classList.add("citeResultResolve");
        } else {
            element.classList.add("citeResultReject");
        }
        return element;
    }
    return {
        get: () => {
            const queryArea = document.getElementById("cite_query");
            var xhr = new XMLHttpRequest();
            xhr.open("GET", `../service/citation.js?q=${queryArea.value}`);
            xhr.onload = () => {
                switch (xhr.response) {
                    case "not": Cite(); break;
                    case "reject": 
                        const message = `Your URL ${queryArea.value} is not supported currently.`;
                        citationArea.append(elementOf(message, "rejected"));
                        queryArea.value = "";
                        break;
                    default: 
                        citationArea.append(elementOf(xhr.response, "resolved"));
                        window.localStorage.setItem(counter++, xhr.response);
                        queryArea.value = "";
                }
            }
            xhr.send();
        },
        load: () => {
            if (localStorage.length) {
                counter = localStorage.length;
                for (var i = 0; i < localStorage.length; i++) {
                    citationArea.append(elementOf(localStorage.getItem(i), "resolved"));
                }
            }
        }
    }
})();

document.getElementById("meow_button").onclick = Meow;
