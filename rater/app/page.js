'use client'

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role:'assistant',
      content: "Hi! I'm the GreatReads assistant. How can I help you today?" 
    }

  const [message, setMessage] = useState('')
  const sendMessage = async() => {
    setMessage=((messages) => [
      ...messages,
      {role:"user", content: message},
      {role:"assistant", content: ''}
    ])

    
    setMessage('')
    const response = fetch('/api/chat/',{
      method:"POST",
      headers:{
        'content-type':'application/json'
      },
      body: JSON.stringify([...messages, {role:"user", content: message}])
    }).then(async(res)=>{
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({done, value}){
        if(done)
        {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((message) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length -1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })

        return reader.read().then(processText)
      })

    })
    
  }
  
  
  
  return (
    <Box></Box>
    
  );
}
