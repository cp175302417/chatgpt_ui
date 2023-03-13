import React, { useState, useEffect, useRef} from "react";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
const ConversationPage = () => {
  const [apiKey, setApiKey] = useState(null);
  const [dialist, SetDialist] = useState(null);
  const [currentDiaIndex, SetCurrentDiaIndex] = useState(-1);

  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([{role: "system", content: "你是一个万能助手。"}]);

  const diabox = useRef(null);

  useEffect(() => {
    if(apiKey != null)
      return
    let _apikey = localStorage.getItem("apikey");
    if(_apikey != null){
      setApiKey(_apikey)
    }
    else{
      _apikey = prompt("请输入apikey", "")
      if(_apikey != null){
        setApiKey(_apikey)
        localStorage.setItem("apikey", _apikey)
      }
    }
  }, [apiKey])

  useEffect(() => {
    // Update the document title using the browser API
    if(dialist == null){ //启动
      console.log("init")
      let value = localStorage.getItem("dialist");
      let _dialist = []
      if(value != null){
        console.log(value)
        _dialist = JSON.parse(value)
        SetDialist(_dialist)
      }
      else{
        console.log("dialist is null")
        SetDialist([])
      }
      
      let _currentDiaIndex = localStorage.getItem("currentDiaIndex");
      console.log("currentDiaIndex:" + _currentDiaIndex)
      if(_currentDiaIndex != null){
        let ci = parseInt(_currentDiaIndex)
        if(ci > -1 && ci < _dialist.length){
          SetCurrentDiaIndex(ci)
          handleIndexChange(ci)
        }
      }
    }
    else{
      console.log(JSON.stringify(dialist))
    }
  },[dialist]);

  useEffect(() => {
    // 滚动到底部
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleIndexChange = (index) => {
    let _messages = localStorage.getItem("messages_" + index);
    if(_messages == null){
      console.log("load messages: null")
      _messages = []
    }
    else{
      console.log("load messages:" + _messages)
      setMessages(JSON.parse(_messages))
    }
  }

  function scrollToBottom() {
    diabox.current.scrollTop = diabox.current.scrollHeight;
  }

  const handleSendClick = () => {
    // 构造要发送的数据
    inputValue.replace("\n", "\n\n")
    let message = {"role": "user", "content": inputValue}
    let _messages = [...messages, message]
    setMessages(_messages)
    const data = {
      "model": "gpt-3.5-turbo",
      "messages": _messages
    }
    setSending(true)
    // 发送数据到API
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", 
        "Authorization" : "Bearer " + apiKey
      },
      body: JSON.stringify(data),
    }).then((response) => {
      // 处理服务器返回的数据
      
      response.json().then((data) => {
        // 把服务器返回的消息添加到对话框中
        console.log(JSON.stringify(data))
        let pmessages = [..._messages, data.choices[0].message]
        
        if(currentDiaIndex === -1){
          let _dialist = [...dialist, "新对话"]
          SetDialist(_dialist)
          SetCurrentDiaIndex(_dialist.length - 1)
          localStorage.setItem("dialist", JSON.stringify(_dialist))
          localStorage.setItem("currentDiaIndex", _dialist.length - 1)
        }
        localStorage.setItem("messages_" + currentDiaIndex, JSON.stringify(pmessages));
        setMessages(pmessages);
        diabox.current.scrollTop = 0
      });
      setSending(false)
    }).catch((error) => {setSending(false)});
    // 清空输入框
    setInputValue("");
  };

  let handleNewDiaClick = () => {
    let _dialist = [...dialist, "新对话"]
    SetDialist(_dialist)
    SetCurrentDiaIndex(_dialist.length - 1)
    localStorage.setItem("dialist", JSON.stringify(_dialist))
    handleIndexChange(_dialist.length - 1)
  }

  let handleDeleteDiaClick = (index) => {
    console.log("delete:" + index)
    let _dialist = dialist
    _dialist.splice(index, 1)
    SetDialist(_dialist)
    localStorage.setItem("dialist", JSON.stringify(_dialist))
    if(index === currentDiaIndex){
      SetCurrentDiaIndex(-1)
      localStorage.setItem("currentDiaIndex", -1)
      handleIndexChange(-1)
    }
  }

  let handleEditDiaClick = (index) => {
    let _dialist = dialist
    
    let name = prompt("请输入对话名称", _dialist[index])
    console.log("edit:" + index + " " + name)
    if(name !==null && name !== _dialist[index]){
      _dialist[index] = name
      SetDialist([..._dialist])
      localStorage.setItem("dialist", JSON.stringify(_dialist))
    }

  }

  let handleEditApiKeyClick = () => {
    let _apikey = prompt("请输入apikey", apiKey)
    if(_apikey != null){
      localStorage.setItem("apikey", _apikey)
      setApiKey(_apikey)
    }
  }

  let fc = {height: "100%", display: "flex", flexDirection: "row"}
  let lc = {width: "200px", height: "100%", borderRight: "1px solid black", backgroundColor: "#000000", display: "flex", flexDirection: "column"}

  let fs = {height: "100%", display: "flex", flexDirection: "column", flex:1}
  let foot = {float: "bottom", height:"50px"}
  let dia = {flex : 1, overflow: "hidden", overflowY: "scroll", height: "100%"}
  let leftdia = {textAlign: "left", minWidth:"100px", margin: "2px"}
  let rightdia = {textAlign: "left", minWidth:"100px", backgroundColor: "#f0f0f0", margin: "2px"}
  let diaItem = {margin: "2px", color: "#FFFFFF", display:"flex", flexDirection: "row"}
  let diaItemSelect = {margin: "2px", color: "#000000", backgroundColor: "#00FFFF", display:"flex", flexDirection: "row"}
  return (
    <div style={fc}>
      <div style={lc}>
        <button style={{width:'100%'}} onClick={()=>{handleNewDiaClick()}}>建立新对话</button>
        <div style={{flex: 1}}>
          {dialist ? dialist.map((item, index) => {
            return <div key={index} style={index === currentDiaIndex ? diaItemSelect : diaItem}>
                <div style={{flex:1}} onClick={() => {SetCurrentDiaIndex(index); handleIndexChange(index)}}>{item}
                </div>
                <button onClick={()=>{handleEditDiaClick(index)}}>编辑</button>
                <button onClick={()=>{handleDeleteDiaClick(index)}}>删除</button>
              </div>
          }): ""}
        </div>
        
        <button onClick={()=>{handleEditApiKeyClick()}}>设置api key</button>
      </div>
      <div style={fs}>
        <div ref={diabox} style={dia}>
          {messages.map((message, index) => {
            if(message.role === "system"){
              return ""
            }
            else if(message.role === "user"){
              return <div style={leftdia} key={index} >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
            }
            else
              return <div style={rightdia} key={index}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
          })}
        </div>
        <div style={foot}>
          <input value={inputValue} style={{width:'400px'}}onChange={handleInputChange} />
          {/*<textarea value={inputValue} onChange={handleInputChange} />*/}
          <button onClick={handleSendClick} disabled={sending}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;