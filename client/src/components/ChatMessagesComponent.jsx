// import { useCallback, useContext, useEffect, useRef, useState } from "react";
// import { useDispatch } from "react-redux";
// import { Link } from "react-router-dom";
// import { ChatInput } from "../components";
// import { addOwnerRecentMessage } from "../features/ownerUser/ownerUserSlice";
// import { addTenantRecentMessage } from "../features/tenantUser/tenantUserSlice";
// import axiosFetch from "../utils/axiosCreate";
// import { SocketContext } from "../utils/SocketContext";

// const ChatMessages = ({
//   chat,
//   currentUser,
//   fromTenant,
//   handleCurrentChatChange,
// }) => {
//   const [messages, setMessages] = useState([]);
//   const scrollRef = useRef();
//   const [isLoaded, setIsLoaded] = useState(false);
//   const { socketMessage, sendMessage } = useContext(SocketContext);
//   const dispatch = useDispatch();
//   const getMessage = useCallback(
//     async (chatId) => {
//       try {
//         setIsLoaded(false);

//         const { data } = await axiosFetch.post(
//           `/chat/${fromTenant ? "tenant" : "owner"}/get-messages`,
//           {
//             to: chatId,
//           }
//         );

//         setIsLoaded(true);
//         setMessages(data.messages);
//       } catch (error) {
//         console.log(error);
//       }
//     },
//     [fromTenant]
//   );

//   useEffect(() => {
//     getMessage(chat?._id);
//   }, [chat, getMessage]);

//   const handleSendMessage = async (msgInput) => {
//     try {
//       await axiosFetch.post(
//         `/chat/${fromTenant ? "tenant" : "owner"}/send-message`,
//         {
//           to: chat?._id,
//           message: msgInput,
//         }
//       );

//       sendMessage(currentUser?._id, chat?._id, msgInput);

//       const oldMessages = [...messages];
//       oldMessages.push({ fromSelf: true, message: msgInput });
//       setMessages(oldMessages);

//       if (fromTenant) {
//         dispatch(
//           addTenantRecentMessage({
//             chatId: chat?._id,
//             message: msgInput,
//             sender: currentUser?._id,
//           })
//         );
//       } else {
//         dispatch(
//           addOwnerRecentMessage({
//             chatId: chat?._id,
//             message: msgInput,
//             sender: currentUser?._id,
//           })
//         );
//       }

//       handleCurrentChatChange(chat, chat?._id);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     if (
//       socketMessage &&
//       socketMessage.to === currentUser?._id &&
//       socketMessage.from === chat?._id
//     ) {
//       setMessages((prev) => [...prev, socketMessage]);
//     }
//   }, [socketMessage]);

//   useEffect(() => {
//     scrollRef.current?.scrollIntoView();
//   }, [messages]);

//   if (!isLoaded) {
//     return (
//       <div className="flex justify-center items-center h-64 w-full">
//         <p className="font-display text-base md:text-xl lg:text-2xl text-center">
//           Loading...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="flex flex-col w-full"
//       style={{
//         maxHeight: "500px",
//       }}
//     >
//       <Link
//         to={`${fromTenant ? "/tenant/owner-user" : "/owner/tenant-user"}/${
//           chat?.slug
//         }`}
//       >
//         <div className="flex items-center gap-4 py-4 cursor-pointer">
//           <img
//             src={chat?.profileImage}
//             alt="pfp"
//             className="w-8 h-8 rounded-full object-cover md:w-12 md:h-12"
//           />
//           <p className="font-roboto  md:text-lg">
//             {chat?.firstName} {chat?.lastName}
//           </p>
//         </div>
//       </Link>

//       <div className="overflow-auto">
//         {chat && messages?.length === 0 && (
//           <div className="flex justify-center items-center h-64 w-full">
//             <p className="font-display text-base md:text-xl lg:text-2xl text-center">
//               No messages yet
//             </p>
//           </div>
//         )}

//         {messages?.map((message, index) => (
//           <div
//             className={`flex ${
//               message.fromSelf ? "justify-end ml-5" : "justify-start mr-5"
//             }`}
//             key={index}
//             ref={scrollRef}
//           >
//             <div
//               className={`flex items-center gap-4 p-1 md:p-2 rounded-2xl my-1 max-w-xl ${
//                 !message.fromSelf ? "bg-primary text-white" : "bg-white"
//               }`}
//             >
//               <p>{message.message}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="mt-4">
//         <ChatInput handleSendMessage={handleSendMessage} />
//       </div>
//     </div>
//   );
// };

// export default ChatMessages;
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { ChatInput } from "../components";
import { addOwnerRecentMessage } from "../features/ownerUser/ownerUserSlice";
import { addTenantRecentMessage } from "../features/tenantUser/tenantUserSlice";
import axiosFetch from "../utils/axiosCreate";
import { SocketContext } from "../utils/SocketContext";

const ChatMessages = ({
  chat,
  currentUser,
  fromTenant,
  handleCurrentChatChange,
}) => {
  const [messages, setMessages] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef();
  const { socket, sendMessage, markAsRead, isConnected } =
    useContext(SocketContext);
  const dispatch = useDispatch();

  // Get the other participant's ID
  const getRecipientId = () => {
    if (!chat?.chatUsers || !currentUser?._id) return null;
    return chat.chatUsers.find((id) => id !== currentUser._id);
  };

  // Fetch initial messages
  const getMessage = useCallback(async () => {
    try {
      setIsLoaded(false);
      const recipientId = getRecipientId();
      if (!recipientId) return;

      const { data } = await axiosFetch.post(
        `/chat/${fromTenant ? "tenant" : "owner"}/get-messages`,
        { to: recipientId }
      );

      setIsLoaded(true);
      setMessages(data.messages);

      // Mark messages as read when opening chat
      markAsRead(recipientId);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setIsLoaded(true);
    }
  }, [chat, currentUser?._id, fromTenant]);

  useEffect(() => {
    getMessage();
  }, [getMessage]);

  // Handle real-time messages
  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    const handleReceiveMessage = (message) => {
      console.log("📥 Received real-time message:", {
        from: message.from,
        to: message.to,
        currentUser: currentUser._id,
        isSelf: message.from === currentUser._id,
      });

      const recipientId = getRecipientId();
      if (message.from === recipientId || message.to === recipientId) {
        setMessages((prev) => [
          ...prev,
          {
            fromSelf: message.from === currentUser._id,
            message: message.message,
            isRead: message.isRead,
            createdAt: message.createdAt,
          },
        ]);

        // Update recent messages in Redux
        if (fromTenant) {
          dispatch(
            addTenantRecentMessage({
              chatId: message.from,
              message: message.message,
              sender: message.from,
            })
          );
        } else {
          dispatch(
            addOwnerRecentMessage({
              chatId: message.from,
              message: message.message,
              sender: message.from,
            })
          );
        }
      }
    };

    socket.on("receiveMsg", handleReceiveMessage);

    return () => {
      socket.off("receiveMsg", handleReceiveMessage);
    };
  }, [socket, chat, currentUser?._id, fromTenant, dispatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (msgInput) => {
    if (!msgInput.trim() || !isConnected) return;

    try {
      const recipientId = getRecipientId();
      if (!recipientId) {
        console.error("No recipient found");
        return;
      }

      // // Optimistic UI update
      // const tempMessage = {
      //   fromSelf: true,
      //   message: msgInput,
      //   isRead: true,
      //   createdAt: new Date(),
      // };
      // setMessages((prev) => [...prev, tempMessage]);

      // Save to database via HTTP
      await axiosFetch.post(
        `/chat/${fromTenant ? "tenant" : "owner"}/send-message`,
        { to: recipientId, message: msgInput }
      );

      // Send via WebSocket for real-time delivery
      sendMessage(recipientId, msgInput);

      // Update recent messages in Redux
      if (fromTenant) {
        dispatch(
          addTenantRecentMessage({
            chatId: recipientId,
            message: msgInput,
            sender: currentUser._id,
          })
        );
      } else {
        dispatch(
          addOwnerRecentMessage({
            chatId: recipientId,
            message: msgInput,
            sender: currentUser._id,
          })
        );
      }

      handleCurrentChatChange(chat, recipientId);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Rollback optimistic update
      setMessages((prev) => prev.filter((msg) => msg !== tempMessage));
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <p className="font-display text-base md:text-xl lg:text-2xl text-center">
          Loading...
        </p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <p className="font-display text-base md:text-xl lg:text-2xl text-center">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full" style={{ maxHeight: "500px" }}>
      <Link
        to={`${fromTenant ? "/tenant/owner-user" : "/owner/tenant-user"}/${
          chat?.slug
        }`}
      >
        <div className="flex items-center gap-4 py-4 cursor-pointer">
          <img
            src={chat?.profileImage}
            alt="profile"
            className="w-8 h-8 rounded-full object-cover md:w-12 md:h-12"
          />
          <p className="font-roboto md:text-lg">
            {chat?.firstName} {chat?.lastName}
          </p>
          {!isConnected && (
            <span className="text-xs text-red-500">(Offline)</span>
          )}
        </div>
      </Link>

      <div className="overflow-auto flex-1">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-64 w-full">
            <p className="font-display text-base md:text-xl lg:text-2xl text-center">
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              className={`flex ${
                message.fromSelf ? "justify-end ml-5" : "justify-start mr-5"
              }`}
              key={index}
              ref={index === messages.length - 1 ? scrollRef : null}
            >
              <div
                className={`flex items-center gap-4 p-1 md:p-2 rounded-2xl my-1 max-w-xl ${
                  !message.fromSelf ? "bg-primary text-white" : "bg-white"
                }`}
              >
                <p>{message.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <ChatInput
          handleSendMessage={handleSendMessage}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default ChatMessages;
