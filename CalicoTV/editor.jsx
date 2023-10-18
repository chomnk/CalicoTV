class EmojiBoard extends React.Component {
    render() {
  	    return (
            <div className={"emoji_board"}>
    	        {Array.from({length: this.props.num}, (value, key) => <button
                    key={Math.random()}
                    className={"emoji_button"}
                    onClick={(event) => this.props.onClickEmoji(key)}
                    style={{backgroundImage: `url(http://calicotv.com/image/emoji/nyankoSticker/${key + 1}.png)`}}
                ></button>)}
            </div>
        );
    }
}

class Reply extends React.Component {
    constructor(props) {
        super(props);

        this.textArea = React.createRef();

        this.handleInput = this.handleInput.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.showEmojiBoard = this.showEmojiBoard.bind(this);
        this.handleEmojiClick = this.handleEmojiClick.bind(this);

        this.state = {
            isOpen: true,
            emojiBoard: null,
            button: false
        }
    }

    handleInput() {
        this.textArea.current.innerHTML == ""
            ? this.setState({button: true}, () => {})
            : this.setState({button: false}, () => {});
    }

    handleSubmit() {
        const info = [];
        this.textArea.current.childNodes.forEach(node => {
            node.nodeName == "#text"
                ? info.push({type: "text", content: node.data})
                : info.push({type: "image", content: node.currentSrc});
        });
        const body = {
            username: "test",//function
            date: Date.now(),
            text: info,
            parentID: this.props.parentID,
            level: this.props.level
        };
        const init = {
            method: "POST", 
            headers: {
                "Content-Type": "application/json", 
                'Accept': 'application/json'
            }, 
            body: JSON.stringify(body)
        };
        fetch("../API/postComment", init)
            .then(response => response.json())
            .then(data => console.log(data));
    }

    showEmojiBoard() {
        this.state.isOpen
            ? this.setState({emojiBoard: <EmojiBoard
                num={40}
                onClickEmoji={this.handleEmojiClick}
            ></EmojiBoard>})
            : this.setState({emojiBoard: null});
        this.setState({isOpen: !this.state.isOpen});
    }

    handleEmojiClick(int) {
        var sel = window.getSelection();
        var range = sel.getRangeAt(0);
        range.deleteContents();

        var node = document.createElement("img");
        var a = document.createAttribute("src");
        a.value = `http://calicotv.com/image/emoji/nyankoSticker/${int + 1}.png`;
        node.setAttributeNode(a);
        node.classList.add("textbox_emoji");

        range.insertNode(node);
        range.setStartAfter(node);
        sel.removeAllRanges();
        sel.addRange(range);

        this.setState({emojiBoard: null});
        this.setState({isOpen: !this.state.isOpen});
    }

    render() {
        return (
            <div>
                <div className="comment_editor_header">Comment as:<input type="text" required></input></div>
                <div 
                    className="comment_editor_main"
                    contentEditable="true"
                    spellCheck="true"
                    ref={this.textArea}
                    onInput={this.handleInput}
                ></div>
                <div className="comment_editor_portal">
                    <button className="emoji" onClick={this.showEmojiBoard}>Add Emoji</button>
                    <button 
                        className="submit" 
                        disabled={this.state.button} 
                        onClick={this.handleSubmit}
                    >Comment</button>
                    <div>{this.state.emojiBoard}</div>
                </div>
            </div>
        );
    }
}

ReactDOM.createRoot(document.getElementById("test")).render(<Reply parentID={0} level={0}></Reply>);

const temp = (
    <div class="comment" id="12" level="78">
        <div class="comment_heading">
            <button class="expand_button"></button>
            <img class="avatar head" alt="User avatar" src="./image/defaultAvatar.png"></img>
            <span class="username head" uid="34">undefined</span>
            <span class="separationDot head">·</span>
            <span class="date head">1652530423604</span>
        </div>
        <i class="threadLine"></i>
        <p class="comment_body">falun</p>
        <div class="comment_portal">
            <div class="comment_portal_vote portalElement">
                <button class="upvote vote_button"></button>
                <span class="netVote">0</span>
                <button class="downvote vote_button"></button>
            </div>
            <div class="comment_portal_reply portalElement" username="undefined" identifier="12" level="78" replystatus="no">Reply</div>
            <div class="comment_portal_copy portalElement">Copy</div>
        </div>
        <div class="replies"></div>
    </div>
);