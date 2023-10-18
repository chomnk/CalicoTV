function nodeWithClass(name, classArr) {
    const result = document.createElement(name);
    classArr.forEach((i) => {result.classList.add(i);});
    return result;
}

function loadElement(target, elementArr) {
    elementArr.forEach((i) => target.appendChild(i));
}

const tools = {
    secure: (text) => {
        return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    COMMENT_LIMIT_COUNTER: 0
};

function buildElement(obj) {
    if (!obj) {return;}
    //root container
    var comment = nodeWithClass("div", ["comment"]);
    comment.setAttribute("id", obj._id);
    comment.setAttribute("level", obj.level);

    //general: 5
    var heading = nodeWithClass("div", ["comment_heading"]);
    var threadLine = nodeWithClass("i", ["threadLine"]);
    threadLine.onclick = (e) => collapse(e);
    var body = nodeWithClass("p", ["comment_body"]);
    body.innerHTML = obj.text;
    var portal = nodeWithClass("div", ["comment_portal"]);
    var replies = nodeWithClass("div", ["replies"]);

    loadElement(comment, [heading, threadLine, body, portal, replies]);
    
    //general end, headers start
    var expandTrigger = nodeWithClass("button", ["expand_button"]);
    expandTrigger.onclick = (e) => expand(e);
    var avatar = nodeWithClass("img", ["avatar", "head"]);
    avatar.setAttribute("alt", "User avatar");
    avatar.setAttribute("src", "./image/defaultAvatar.png");
    var username = nodeWithClass("span", ["username", "head"]);
    username.innerHTML = obj.name;
    username.setAttribute("uid", obj.uid);
    var dot = nodeWithClass("span", ["separationDot", "head"]);
    dot.innerHTML = "·";
    var date = nodeWithClass("span", ["date", "head"]);
    date.innerHTML = obj.date;

    loadElement(heading, [expandTrigger, avatar, username, dot, date]);

    //headers end, for comment portal
    var vote = nodeWithClass("div", ["comment_portal_vote", "portalElement"]);
    var upButton = nodeWithClass("button", ["upvote", "vote_button"]);
    upButton.onclick = (e) => voteComment(e);
    var netVote = nodeWithClass("span", ["netVote"]);

    //add number of net vote
    netVote.innerHTML = obj.karma;
    var downButton = nodeWithClass("button", ["downvote", "vote_button"]);
    downButton.onclick = (e) => voteComment(e);

    loadElement(vote, [upButton, netVote, downButton]);

    var reply = nodeWithClass("div", ["comment_portal_reply", "portalElement"]);
    reply.innerHTML = "Reply";
    reply.setAttribute("username", obj.name);
    reply.setAttribute("identifier", obj._id);
    reply.setAttribute("level", obj.level);
    reply.setAttribute("replyStatus", "no");
    reply.onclick = (e) => replyHandler(e, obj.level);
    var copy = nodeWithClass("div", ["comment_portal_copy", "portalElement"]);
    copy.innerHTML = "Copy";
    copy.onclick = (e) => copyHandler(e);

    loadElement(portal, [vote, reply, copy]);
    //comment portal end, recur start

    obj.reply.forEach((i) => loadElement(replies, [buildElement(i)]));

    return comment;
}

const replyHandler = (event, level) => {
    const location = event.target.parentNode.nextSibling;
    if (event.target.getAttribute("replyStatus") == "yes") {
        location.children[0].remove();
        event.target.setAttribute("replyStatus", "no");
        return;
    }
    level == 5
        ? alert("replyMaxLimit")
        : (location.insertBefore(buildEditor(event), location.firstChild),
        event.target.setAttribute("replyStatus", "yes"));
}

function copyHandler(event) {
    const element = event.target.parentNode.previousSibling;
    selectText(element);
    document.execCommand("copy");
    alert("Reply copied!");
}

function selectText(element) {
    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
}

function voteComment(event) {
    const comment = event.target.parentNode.parentNode.parentNode;
    const commentID = comment.id;
    const val = event.target.classList[0] == "upvote" ? 1 : -1;
    const voteHistory = localStorage.getItem(commentID) ? Number(localStorage.getItem(commentID)) : 0;
    var operation;
    switch (val) {
        case -1: switch (voteHistory) {
            case -1: operation = 1; localStorage[commentID] = 0; break;
            case 0: operation = -1; localStorage[commentID] = -1; break;
            case 1: operation = -2; localStorage[commentID] = -1; break;
        }; break;
        case 1: switch (voteHistory) {
            case -1: operation = 2; localStorage[commentID] = 1; break;
            case 0: operation = 1; localStorage[commentID] = 1; break;
            case 1: operation = -1; localStorage[commentID] = 0; break;
        }; break;
    }
    /*
    -----------------------------------
    |     vH|    -1 |  0    |  1
    |val    |       |       |
    -----------------------------------
    |    -1 |cancel  down     cancel up + down
    |       |down                                       therefore: [1, -1, -2], [2, 1, -1]                                                                  
    -----------------------------------
    |    1  |cancel    up     cancel up
    |       |down + up
    -----------------------------------
    */
    const body = {commentID: commentID, operation: operation};
    const init = {
        method: "POST", 
        headers: {
            "Content-Type": "application/json", 
            'Accept': 'application/json'
        }, 
        body: JSON.stringify(body)
    };
    fetch("../service/modifyIndexComment", init).then(response => {
        response.status == 200 
            ? void adjustElementVoting()
            : (localStorage[commentID] = voteHistory, alert(`Operation failed. HTTP status code: ${response}`));
    });
}

function postComment(event) {
    const body = {
        username: initUsername(),
        _id: "",//given by backend
        date: Date.now(),
        karma: 0,//const 0
        text: event.target.parentNode.previousSibling.previousSibling.children[0].innerHTML,
        reply: [],//const 0
        parentID: event.target.parentNode.parentNode.id,
        level: event.target.getAttribute("level")
    };
    const init = {
        method: "POST", 
        headers: {
            "Content-Type": "application/json", 
            'Accept': 'application/json'
        }, 
        body: JSON.stringify(body)
    };
    fetch("../service/postIndexComment", init).then(response => {
        body.parentID == "NULL"
            ? document.getElementById("comment_thread").appendChild(buildElement(response.body))
            : event.target.parentNode.parentNode.remove(),
            document.getElementById(body.parentID).children[4].appendChild(buildElement(response.body));
    });
}

function fetchComment(fetchType) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        const body = {fetchType: fetchType, fetchFrom: tools.COMMENT_LIMIT_COUNTER};
        const init = {
            method: "POST", 
            headers: {
                "Content-Type": "application/json", 
                'Accept': 'application/json'
            }, 
            body: JSON.stringify(body)
        };
        fetch("../service/fetchIndexComment", init)
            .then(response => {
                response.json().then(result => {
                    result.forEach(comment => document.getElementById("comment_thread").appendChild(buildElement(comment)));
                    //adjustElementVoting();
                    tools.COMMENT_LIMIT_COUNTER += 10;
                })
        });
    }
}

function collapse(event) {
    const element = event.target.parentNode;
    element.children[0].children[0].style.display = "inline-block";
    for (var i = 1; i < element.childElementCount; i++) {
        element.children[i].style.display = "none";
    }
}

function expand(event) {
    const element = event.target.parentNode.parentNode;
    event.target.style.display = "none";
    for (var i = 1; i < element.childElementCount; i++) {
        i == 3
            ? element.children[i].style.display = "flex"
            : element.children[i].style.display = "block";
    }
}

const renderAfterVote = () => {

}

function adjustElementVoting() {
    for (const key in localStorage) {
        var comment_portal_vote = document.getElementById(key).children[3].children[0];
        if (localStorage[key] == 1) {
            comment_portal_vote.children[0].style["background-color"] = "orange";
        } else {
            comment_portal_vote.children[0].style["background-color"] = "grey";
        }
    }
}

function adjustTime(unixTime) {
    var timeString;
    const offset = (unixTime - Date.now()) / 1000;
    if (offset < 60) {
        timeString = `${Math.floor(offset)} secs ago`;
    } else if (offset > 60 && offset < 3600) {
        timeString = `${Math.floor(offset / 60)} mins ago`;
    } else if (offset > 3600 && offset < 86400) {
        timeString = `${Math.floor(offset / 3600)} hours ago`;
    } else if (offset > 86400 && offset < 864000) {
        timeString = `${Math.floor(offset / 86400)} days ago`;
    } else {
        timeString = new Date(unixTime).toDateString();
    }
    return timeString;
}

function onCommentSortChange(event) {
    Array.from(document.querySelectorAll("[name=comment_thread_loadmode_element]")).forEach((i) => i.removeAttribute("checked"));
    event.target.setAttribute("checked", "")
    document.getElementById("comment_thread").children[1].remove();
    fetchComment(event.target.value);
}

Array.from(document.getElementsByClassName("comment_thread_loadmode_element"))
    .forEach((i) => i.addEventListener("click", (e) => onCommentSortChange(e)));

const replaceUsername = () => {
    Array.from(document.querySelectorAll("input[group=name]")).forEach((i) => {
        var element = nodeWithClass("span", ["comment_editor_header_element"]);
        element.innerHTML = localStorage.getItem("username");
        document.replaceChild(element, i);
    });
}

const initUsername = (event, flag) => {
    var element;
    switch (flag) {
        case "onload": localStorage["username"] ? replaceUsername() : void 0; break;
        case "onBuildEditor": localStorage["username"] 
            ? (element = nodeWithClass("span", ["comment_editor_header_element", "reply_name_highlight"]),
              element.innerHTML = localStorage["username"])
            : (element = nodeWithClass("input", ["comment_editor_header_element"]),
              element.setAttribute("type", "text"),
              element.setAttribute("group", "name")),
              element.setAttribute("required", ""); break;

        case "onInitialPost": 
            localStorage.setItem("username", 
                event.target.parentNode.parentNode.getElementsByTagName("input")[0].value);
            replaceUsername(); 
    }
    return element;
}//caller: postcomment, load, buildEditor; return username or not.

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

document.getElementById("meow_button").onclick = Meow;