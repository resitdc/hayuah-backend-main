import whatsappInstance from "@config/whatsapp";
import axiosInstance from "@config/axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const axios = axiosInstance();

interface TemplateLanguage {
  code: string;
};

interface TemplateComponents {
  type: string;
  parameters: any;
};

interface MessageHeader {
  text: string;
}

interface MessageBody {
  text: string;
}

interface MessageFooter {
  text: string;
}

interface Template {
  name: string;
  language: TemplateLanguage;
  components: TemplateComponents[];
};

interface InteractiveButtonReply {
  id: string;
  title: string;
};

interface InteractiveButton {
  type: string;
  reply: InteractiveButtonReply;
};

interface FlowActionPayloadDataParameters {
  product_name?: string;
  product_description?: string;
  product_price?: number;
}

interface FlowActionPayloadParameters {
  screen: string;
  data?: FlowActionPayloadDataParameters;
}

interface InteractiveActionParameters {
  display_text?: string;
  url?: string;
  flow_message_version?: string;
  flow_token?: string;
  flow_name?: string;
  flow_id?: string;
  flow_cta?: string;
  flow_action?: string;
  flow_action_payload?: FlowActionPayloadParameters;
}

interface InteractiveActionListButton {
  id?: string;
  title?: string;
  description?: string;
}

interface InteractiveActionList {
  title?: string;
  rows?: InteractiveActionListButton[];
}

interface InteractiveAction {
  buttons?: InteractiveButton[];
  name?: string;
  parameters?: InteractiveActionParameters;
  button?: string;
  sections?: InteractiveActionList[]
};

interface Interactive {
  type: string;
  header?: MessageHeader;
  body: MessageBody;
  footer?: MessageFooter;
  action?: InteractiveAction;
};

interface MessageResponse {
  replyMessage: string | undefined | "";
  isLastMessageSaved: boolean;
};

interface WhatsappLocation {
  latitude: number;
  longitude: number;
};

const whatsapp: any = whatsappInstance();

//#region - Send Text Message
const sendTextMessage = async (
  recipientNumber: number | string,
  message: string,
  messageSource: string = "SYSTEM - BOT",
  previewUrl: boolean = false
) => {
  // Main code from this function
  const sendMessage = await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    preview_url: previewUrl,
    recipient_type: "individual",
    to: recipientNumber,
    type: "text",
    text: {
      body: message
    }
  });

  return sendMessage;
};
//#endregion - Send Text Message

//#region - Send Image Message
const sendImageMessage = async (
  recipientNumber: number | string,
  imageUrl: string,
  caption?: string,
) => {
  // Main code from this function
  const sendMessage = await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "image",
    image: {
      link: imageUrl,
      caption
    }
  });

  return sendMessage;
};
//#endregion - Send Image Message

const sendImageMessageById = async (
  recipientNumber: number | string,
  imageId: string,
  caption?: string,
) => {
  return await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "image",
    image: {
      id: imageId,
      caption
    }
  });
};

const sendDocumentMessageById = async (
  recipientNumber: number | string,
  documentId: string,
  caption?: string,
  filename?: string,
) => {
  return await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "document",
    document: {
      id: documentId,
      caption,
      filename,
    }
  });
};

const sendDocumentMessageByUrl = async (
  recipientNumber: number | string,
  documentUrl: string,
  caption?: string,
  filename?: string,
) => {
  const sendMessage = await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "document",
    document: {
      link: documentUrl,
      caption,
      filename,
    }
  });

  return sendMessage;
};

//#region - Send Template Message
const sendTemplateMessage = async (
  recipientNumber: number | string,
  template: Template
) => {
  // Main code from this function
  const sendMessage = await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "template",
    template
  });

  return sendMessage;
};
//#endregion - Send Template Message

//#region - Send Interactive Message
const sendInteractiveMessage = async (
  recipientNumber: number | string,
  interactive: Interactive
) => {
  const sendMessage = await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "interactive",
    interactive
  });

  return sendMessage;
};
//#endregion - Send Interactive Message

const sendMessage = async (
  recipientNumber: number | string,
  message: any
) => {
  try {
    const sendMessage = await sendTextMessage(recipientNumber, message);
    if (sendMessage?.status > 299) {
      console.log("==========================================");
      console.log("ERROR SEND MESSAGE FROM messageListener.ts");
      console.log(`Phone Number : ${recipientNumber}`);
      console.log(`Message : ${message}`);
      console.log("\n\n\n");
      return false;
    } else {
      return sendMessage;
    }
  } catch (e) {
    const error = e as Error;
    console.log("==========================================");
    console.log("ERROR SEND MESSAGE FROM messageListener.ts");
    console.log(`Phone Number : ${recipientNumber}`);
    console.log(`Message : ${message}`);
    console.log(`Error Message : ${error.message}`);
    console.log("\n\n\n");
    return false;
  }
};

const fetchMedia = async (mediaId: number | string) => {
  return await axios.get(`/${mediaId}`);
};

const downloadMedia = async (mediaURL: string, fileName: string) => {
  try {
    const response = await axios.get(mediaURL, { responseType: "stream" });
    const writer = fs.createWriteStream(`temp/${fileName}`);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(`temp/${fileName}`));
      writer.on("error", reject);
    });
    return `temp/${fileName}`;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const getFileBuffer = async (mediaURL: string): Promise<Buffer> => {
  try {
    const response = await axios.get(mediaURL, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const sendReadStatus = async (
  messageId: string,
) => {
  return await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
};

const sendReaction = async (
  recipientNumber: number | string,
  messageId: string,
  emoji: string
) => {
  return await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "reaction",
    reaction: {
      message_id: messageId,
      emoji: emoji
    }
  });
};

const sendTyping = async (
  messageId: string,
  type: string = "text",
) => {
  return await whatsapp.post("/messages", {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
    typing_indicator: {
      type: type
    }
  });
};

export {
  whatsappInstance,
  sendTextMessage,
  sendTemplateMessage,
  sendInteractiveMessage,
  fetchMedia,
  downloadMedia,
  getFileBuffer,
  sendImageMessage,
  sendImageMessageById,
  sendDocumentMessageByUrl,
  sendMessage,
  sendDocumentMessageById,
  sendReaction,
  sendReadStatus,
  MessageResponse,
  WhatsappLocation,
  sendTyping,
};
