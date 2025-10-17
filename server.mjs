// server.mjs
import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 2000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
      const { phone, name, email, city, companyName, address, loanType } = req.body;
      const files = req.files;

      console.log("Form data:", req.body);
      console.log("Files uploaded:", files);

      // Nodemailer transporter
    const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

      // Verify connection before sending
      await transporter.verify();
      console.log("SMTP server is ready");

      // Prepare attachments
      const attachments = [];
      if (files) {
        for (const key in files) {
          attachments.push({
            filename: files[key][0].originalname,
            content: files[key][0].buffer,
          });
        }
      }

      // Email content
      const mailOptions = {
        from: `"Loan Application" <${process.env.SMTP_USER}>`,
        to: process.env.EMAIL_TO,
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

      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: "Loan application sent successfully" });
    } catch (err) {
      console.error("Error sending email:", err);
      return res.status(500).json({
        message: "Error sending loan application",
        error: err.message || err,
      });
    }
  }
);

app.listen(2000, () => {
  console.log(`Server running on http://localhost:2000`);
});
