// server.mjs
import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage(); // store files in memory
const upload = multer({ storage });

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

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

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
        to: process.env.TO_EMAIL, // the recipient
        subject: `New Loan Application - ${loanType || "N/A"}`,
        html: `
          <h2>New Loan Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Company Name:</strong> ${companyName}</p>
          <p><strong>Company Address:</strong> ${address}</p>
          <p><strong>Loan Type:</strong> ${loanType}</p>
        `,
        attachments,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: "Loan application sent successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error sending loan application", error: err });
    }
  }
);

app.listen(2000, () => {
  console.log(`Server running on http://localhost:2000`);
});
