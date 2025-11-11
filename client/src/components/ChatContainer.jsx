import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

// ChatContainer component handles showing the chat messages and UI
const ChatContainer = () => {

  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);
  // Ref to keep track of the last message for auto-scroll
  const scrollEnd = useRef()

  const [input, setInput] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if(input.trim()=== "") return null;
    await sendMessage({text: input.trim()})
    setInput("");
  }

  // handle sending an image
  const handleSendImage = async (e) => {
      const file = e.target.files[0]; 
      if (!file || !file.type.startsWith("image/")) {
        toast.error("Select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10 MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async ()=>{
        await sendMessage({image: reader.result});
        e.targetvalue = "";
      }
      reader.readAsDataURL(file);
  }

  useEffect(()=>{
    if(selectedUser){
      getMessages(selectedUser._id)
    }
  },[selectedUser])

  // Auto-scrolls to the bottom whenever new messages are added
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages]) // Dependency: runs whenever message list updates

  // If a user is selected, show the chat area
  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      
      {/* Chat Header (shows selected user's info, status, and options) */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full'/>
        
        {/* User name + status dot */}
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullname}
          {onlineUsers.includes(selectedUser._id)}<span className='w-2 h-2 rounded-full bg-green-500'></span>
        </p>

        {/* Back arrow (visible on mobile) */}
        <img 
          onClick={() => setSelectedUser(null)} 
          src={assets.arrow_icon} 
          alt="" 
          className='md:hidden max-w-7'
        />

        {/* Help icon (hidden on mobile, visible on desktop) */}
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5'/>
      </div>
      
      {/* ============================
          Chat Messages Area 
         ============================ */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-end gap-2 justify-end 
              ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            
            {/* If message contains an image */}
            {msg.image ? (
              <img 
                src={msg.image} 
                alt="" 
                className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'
              />
            ) : (
              // If message contains text
              <p 
                className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white 
                  ${msg.senderId === authUser._id
                    ? 'rounded-br-none' // Message sent by "me"
                    : 'rounded-bl-none'  // Message sent by "other user"
                  }`}
              >
                {msg.text}
              </p>
            )}

            {/* Message Sender Info (avatar + timestamp) */}
            <div className='text-center text-xs'>
              <img 
                src={
                  msg.senderId === authUser._id
                    ? authUser?.profilePic || assets.avatar_icon   // My avatar
                    : selectedUser?.profilePic || assets.avatar_icon  // Other user's avatar
                } 
                alt="User avatar" 
                className="w-7 rounded-full"
              />

              {/* Format time using utility function */}
              <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}

        {/* This empty div ensures scroll sticks to the bottom */}
        <div ref={scrollEnd}></div>
      </div>
      {/* ==============================
          Chat Typing Area (Bottom Input)
         ============================== */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
            
        {/* Input + Image Upload Section */}
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
            
          {/* Text input field */}
          <input 
            onChange={e => setInput(e.target.value)} 
            value={input}
            onKeyDown={e => e.key === "Enter" ? handleSendMessage(e) : null}
            type="text" 
            placeholder='Send a message' 
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'
          />
          
          {/* Hidden file input (for image upload) */}
          <input 
            onChange={handleSendImage}
            type="file" 
            id='image' 
            accept='image/png,image/jpg,image/jpeg' 
            hidden
          />
          
          {/* File input trigger → custom button using <label>*/}
          <label htmlFor="image">
            <img 
              src={assets.gallery_icon} 
              alt="Upload" 
              className='w-5 mr-2 cursor-pointer'
            />
          </label>
        </div>
            
        {/* Send button */}
        <button type="button">
          <img onClick={handleSendMessage}
            src={assets.send_button} 
            alt="Send" 
            className='w-7 cursor-pointer'
          />
        </button>
      </div>

    </div>
  ) : (
    // If no user is selected, show this default screen
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="" className='max-w-16'/>
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer
