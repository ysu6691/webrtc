interface Iprops {
    chat: string
}

const Chat = function (props: Iprops) {
    return (
        <div>
            {props.chat}
        </div>
    )
}

export default Chat