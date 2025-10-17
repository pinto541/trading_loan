// server.mjs
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM; // must be a verified sender in SendGrid

// Helper to safely get body fields
const getField = (obj, key) => (obj[key] ? obj[key] : "");

// Endpoint to handle loan form submission
app.post(
  "/send-loan",
  upload.fields([
    { name: "adharCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "bankStatement", maxCount: 1 },
    { name: "salarySlip", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;

      console.log("Form data:", req.body);
      console.log("Files uploaded:", files);

      // Prepare attachments for SendGrid
      const attachments = [];
      if (files) {
        for (const key in files) {
          attachments.push({
            content: files[key][0].buffer.toString("base64"),
            filename: files[key][0].originalname,
            type: files[key][0].mimetype,
            disposition: "attachment",
          });
        }
      }

      // Email content
      const msg = {
        to: EMAIL_TO,
        from: EMAIL_FROM,
        subject: `New Loan Application - ${getField(req.body, "loanType")}`,
        html: `
          <h2>New Loan Application</h2>
          <p><strong>Name:</strong> ${getField(req.body, "name")}</p>
          <p><strong>Email:</strong> ${getField(req.body, "email")}</p>
          <p><strong>Phone:</strong> ${getField(req.body, "phone")}</p>
          <p><strong>City:</strong> ${getField(req.body, "city")}</p>
          <p><strong>Company Name:</strong> ${getField(req.body, "companyName")}</p>
          <p><strong>Company Address:</strong> ${getField(req.body, "address")}</p>
          <p><strong>Loan Type:</strong> ${getField(req.body, "loanType")}</p>
        `,
        attachments,
      };

      await sgMail.send(msg);

      return res.status(200).json({ message: "Loan application sent successfully" });
    } catch (err) {
      console.error("SendGrid Error:", err);
      return res.status(500).json({
        message: "Error sending loan application",
        error: err.message || err,
      });
    }
  }
);

app.listen(4000, () => {
  console.log(`Server running on http://localhost:4000`);
});
