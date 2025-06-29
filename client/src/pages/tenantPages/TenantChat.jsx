// import { useEffect, useState, useContext } from "react";
// import { useLocation } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   addTenantRecentMessage,
//   getTenantChats,
//   markChatAsRead,
// } from "../../features/tenantUser/tenantUserSlice";
// import { PageLoading, ChatUsers, ChatMessages } from "../../components";
// import { socket } from "../../socket";
// import { SocketContext } from "../../utils/SocketContext";

// const TenantChat = () => {
//   const dispatch = useDispatch();
//   const location = useLocation();

//   const { chats, isLoading } = useSelector((state) => state.tenantUser);
//   const { user } = useSelector((state) => state.auth);
//   const [currentChat, setCurrentChat] = useState(null);
//   const [currentSelectedChatIndex, setCurrentChatIndex] = useState(null);

//   const { socketMessage } = useContext(SocketContext);

//   useEffect(() => {
//     dispatch(getTenantChats());
//   }, [dispatch]);

//   // set the current chat to location state if it exists
//   useEffect(() => {
//     if (location?.state) {
//       handleCurrentChatChange(location.state);
//     }
//   }, [location.state]);

//   useEffect(() => {
//     if (socketMessage) {
//       dispatch(
//         addTenantRecentMessage({
//           chatId: socketMessage?.from,
//           message: socketMessage?.message,
//           sender: socketMessage?.from,
//         })
//       );
//     }
//   }, [socketMessage]);

//   const handleCurrentChatChange = (chat) => {
//     socket?.emit("markAsRead", {
//       receiverID: user?._id,
//       senderId: chat?._id,
//     });

//     setCurrentChat(chat);
//     setCurrentChatIndex(chat?._id);
//     dispatch(markChatAsRead({ chatId: chat?._id }));
//   };

//   if (isLoading) {
//     return <PageLoading />;
//   }
//   if (chats?.length === 0) {
//     return (
//       <div className="mt-12">
//         <h3 className="font-robotoNormal text-center">
//           No chat available. Add a contact to start chatting.
//         </h3>
//       </div>
//     );
//   }
//   return (
//     <div className="flex flex-col flex-wrap justify-center gap-8 md:justify-start mt-12 mb-8 px-6 md:mx-4">
//       <h3 className="font-heading font-bold">Chat</h3>
//       <div
//         className="flex gap-4"
//         style={{
//           maxHeight: "500px",
//         }}
//       >
//         <div className="flex flex-col gap-4 w-1/3 overflow-y-auto overflow-x-hidden">
//           {chats?.map((chat) => (
//             <div key={chat?._id} onClick={() => handleCurrentChatChange(chat)}>
//               <div
//                 className={`${
//                   currentSelectedChatIndex === chat?._id && "bg-slate-300"
//                 } rounded-md`}
//               >
//                 <ChatUsers chat={chat} currentUser={user} />
//               </div>
//             </div>
//           ))}
//         </div>
//         {currentChat === null ? (
//           <div className="flex justify-center items-center h-64 w-full">
//             <p className="font-display text-base md:text-xl lg:text-2xl text-center">
//               Click on a chat to start messaging
//             </p>
//           </div>
//         ) : (
//           <ChatMessages
//             chat={currentChat}
//               currentUser={user}
//               fromTenant
//               handleCurrentChatChange={handleCurrentChatChange}
//             />
//         )}
//       </div>
//     </div>
//   );
// };

// export default TenantChat;


import AddIcon from "@mui/icons-material/Add";
import ChatIcon from "@mui/icons-material/Chat";
import { Button } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatMessages, ChatUsers, PageLoading } from "../../components";
import {
  addTenantRecentMessage,
  getTenantChats,
  markChatAsRead,
} from "../../features/tenantUser/tenantUserSlice";
import { SocketContext } from "../../utils/SocketContext";

const TenantChat = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { chats, isLoading } = useSelector((state) => state.tenantUser);
  const { user } = useSelector((state) => state.auth);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentSelectedChatIndex, setCurrentChatIndex] = useState(null);
  const { socketMessage, markAsRead, isConnected } = useContext(SocketContext);

  useEffect(() => {
    dispatch(getTenantChats());
  }, [dispatch]);

  // Handle contact passed from navigation (new chat)
  useEffect(() => {
    if (location?.state && location.state._id) {
      const contactFromNavigation = {
        ...location.state,
        isNewChat: true,
        messages: [],
        // Use _id consistently for new chats
        chatId: location.state._id,
      };

      setCurrentChat(contactFromNavigation);
      setCurrentChatIndex(location.state._id);
      
      // Clear navigation state immediately to prevent conflicts
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle socket messages for chats not currently open
  useEffect(() => {
    if (socketMessage && currentChat) {
      // Get the current chat ID consistently
      const currentChatId = currentChat.isNewChat ? currentChat.chatId : currentChat._id;

      // Only update Redux if message is NOT for currently open chat
      if (socketMessage.from !== currentChatId) {
        console.log("📝 Updating chat list for message from:", socketMessage.from);
        dispatch(
          addTenantRecentMessage({
            chatId: socketMessage.from,
            message: socketMessage.message,
            sender: socketMessage.from,
          })
        );
      }
    }
  }, [socketMessage, currentChat, dispatch]);

  const handleCurrentChatChange = (chat) => {
    // Determine chat ID consistently
    const chatId = chat.isNewChat ? chat.chatId : chat._id;

    // Only emit markAsRead for existing chats, not new ones
    if (!chat.isNewChat && isConnected && chatId) {
      markAsRead(user?._id, chatId);
      dispatch(markChatAsRead({ chatId: chatId }));
    }

    setCurrentChat(chat);
    setCurrentChatIndex(chatId);
  };

  const handleAddContact = () => {
    navigate("/tenant/contacts");
  };

  const handleNewChatCreated = (newChatData) => {
    console.log("New chat created:", newChatData);
    
    // Refresh the chats list
    dispatch(getTenantChats());

    // Update current chat to reflect it's no longer new
    if (currentChat && currentChat.isNewChat) {
      setCurrentChat({
        ...currentChat,
        isNewChat: false,
        _id: newChatData.chatId || newChatData._id,
      });
      setCurrentChatIndex(newChatData.chatId || newChatData._id);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  // Show empty state only if no chats AND no current chat selected
  if (chats?.length === 0 && !currentChat) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 px-6">
        <div className="text-center max-w-md">
          <ChatIcon sx={{ fontSize: 80, color: "#9CA3AF", marginBottom: 2 }} />
          <h3 className="font-heading font-bold text-xl mb-4 text-gray-700">
            No Chats Yet
          </h3>
          <p className="font-robotoNormal text-gray-500 mb-6 text-base">
            Start a conversation by browsing through available contacts and
            sending your first message.
          </p>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddContact}
            size="large"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.5,
            }}
          >
            Browse Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-wrap justify-center gap-8 md:justify-start mt-12 mb-8 px-6 md:mx-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-heading font-bold">Chat</h3>
          {!isConnected && (
            <span className="text-red-500 text-sm">● Offline</span>
          )}
          {isConnected && (
            <span className="text-green-500 text-sm">● Online</span>
          )}
        </div>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddContact}
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Add Contact
        </Button>
      </div>

      <div
        className="flex gap-4"
        style={{
          maxHeight: "500px",
        }}
      >
        <div className="flex flex-col gap-4 w-1/3 overflow-y-auto overflow-x-hidden">
          {/* Show new chat at the top if it exists */}
          {currentChat?.isNewChat && (
            <div
              key="new-chat"
              onClick={() => handleCurrentChatChange(currentChat)}
              className={`${
                currentSelectedChatIndex === 
                (currentChat.isNewChat ? currentChat.chatId : currentChat._id) && "bg-slate-300"
              } rounded-md cursor-pointer hover:bg-slate-100 transition-colors border-2 border-blue-200`}
            >
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={currentChat.profileImage || "/default-avatar.png"}
                    alt={`${currentChat.firstName} ${currentChat.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {currentChat.firstName} {currentChat.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      New conversation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing chats */}
          {chats?.map((chat) => (
            <div key={chat?._id} onClick={() => handleCurrentChatChange(chat)}>
              <div
                className={`${
                  currentSelectedChatIndex === chat?._id && "bg-slate-300"
                } rounded-md cursor-pointer hover:bg-slate-100 transition-colors`}
              >
                <ChatUsers chat={chat} currentUser={user} />
              </div>
            </div>
          ))}
        </div>

        {currentChat === null ? (
          <div className="flex justify-center items-center h-64 w-full">
            <p className="font-display text-base md:text-xl lg:text-2xl text-center text-gray-500">
              Click on a chat to start messaging
            </p>
          </div>
        ) : (
          <ChatMessages
            key={currentChat.isNewChat ? currentChat.chatId : currentChat._id}
            chat={currentChat}
            currentUser={user}
            fromTenant
            handleCurrentChatChange={handleCurrentChatChange}
            onNewChatCreated={handleNewChatCreated}
          />
        )}
      </div>
    </div>
  );
};

export default TenantChat;