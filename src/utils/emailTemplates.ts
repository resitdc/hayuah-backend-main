import path from "path";
import fs from "fs";
const templateCache: Record<string, string> = {};

const loadTemplate = (name: string): string => {
  if (!templateCache[name]) {
    const filePath = path.join(process.cwd(), "dist", "src", "emailTemplates", `${name}.html`);
    templateCache[name] = fs.readFileSync(filePath, "utf-8");
  }
  return templateCache[name];
};

const renderTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return variables[key] ?? "";
  });
};

export const dashboardInvitation = (
  name: string,
  email: string,
  password: string,
) => {
  const loginURL = "https://dashboard.escapenomade.com";
  const template = loadTemplate("dashboardInvitation");
  const html = renderTemplate(template, {
    name,
    email,
    password,
    loginURL,
  });

  let emailTextContent: string = `Hello ${name},\n\n`;
  emailTextContent += "We are thrilled to have you on board! Your account has been successfully created. Please use the credentials below to log in to your account for the first time:\n\n";
  emailTextContent += "-------------------------------------------------\n";
  emailTextContent += `Email    : ${email}\n`;
  emailTextContent += `Password : ${password}\n`;
  emailTextContent += "-------------------------------------------------\n\n";
  emailTextContent += "Note: For your security, we highly recommend changing your password immediately after your first successful login.\n\n";
  emailTextContent += "Log In to Your Account here:\n";
  emailTextContent += `${loginURL}\n\n`;
  emailTextContent += "If you have any questions or need further assistance, please do not hesitate to reply to this email.\n\n";
  emailTextContent += "Warm regards,\n";
  emailTextContent += "The Escape Nomade Team\n\n";
  emailTextContent += "---\n";
  emailTextContent += "© 2026 Escape Nomade. All rights reserved.\n";
  emailTextContent += "If you did not request this account, please ignore this email.";

  return {
    subject: `Welcome to Escape Nomade - Account Invitation`,
    text: emailTextContent,
    list: {
      unsubscribe: {
        url: "https://escapenomade.com/unsubscribe",
        comment: "Unsubscribe"
      }
    },
    html
  };
};
