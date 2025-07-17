import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Button } from "@mui/material";
import { useState } from "react";

const ChatInput = ({ handleSendMessage, isConnected, disabled }) => {
  const [msgInput, setMsgInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!msgInput.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);

    try {
      await handleSendMessage(msgInput);
      setMsgInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={sendMessage}>
      <div className="flex items-center gap-1 md:gap-4">
        <input
          type="text"
          placeholder={
            !isConnected
              ? "Offline - messages will be sent when reconnected"
              : "Type a message"
          }
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          disabled={isSubmitting || disabled}
          className="flex-grow md:px-5 py-3 rounded-full focus:outline-none disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={isSubmitting || disabled || !msgInput.trim()}
        >
          <SendRoundedIcon
            fontSize="large"
            sx={{
              color: isSubmitting || disabled ? "#ccc" : "#0496b4",
            }}
          />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
