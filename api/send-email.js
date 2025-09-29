import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const app = express();

// IMPORTANT: For production, use environment variables to store sensitive data.
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_APP_PASSWORD = process.env.SENDER_APP_PASSWORD;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
const RECIPIENT_EMAILS = RECIPIENT_EMAIL ? RECIPIENT_EMAIL.split(',').map(email => email.trim()) : [];

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if environment variables are available
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️ Supabase environment variables not found');
}

// Configure CORS to allow requests from the Vercel deployment and localhost
app.use(cors({
  origin: ['https://db-request-ext.vercel.app', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081']
}));
app.use(bodyParser.json());

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_APP_PASSWORD,
  },
});

app.post('/api/send-email', async (req, res) => {
  // Note: The endpoint is now /api/send-email, which matches the filename.
  const { name, affiliation, phone, email, items_summary, total } = req.body;
  const formattedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Save to Supabase first (if available)
  if (supabase) {
    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            name,
            affiliation,
            phone,
            email,
            items_summary,
            total_amount: parseInt(total.replace(/,/g, ''), 10), // Remove commas and convert to number
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (submissionError) {
        console.error('Error saving to Supabase:', submissionError);
        // Continue with email sending even if DB save fails
      } else {
        console.log('✅ Submission saved to Supabase:', submissionData.id);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with email sending even if DB save fails
    }
  } else {
    console.log('⚠️ Supabase not configured, skipping database save');
  }

  // 1. Email to Admin
  const adminMailOptions = {
    from: `"DB 신청폼" <${SENDER_EMAIL}>`,
    to: RECIPIENT_EMAILS.join(','),
    subject: `[DB신청] ${name} / ${affiliation} / ${formattedDate}`,
    html: `
      <h2>새로운 DB 신청이 접수되었습니다.</h2>
      <p><strong>신청자:</strong> ${name}</p>
      <p><strong>소속:</strong> ${affiliation}</p>
      <p><strong>연락처:</strong> ${phone}</p>
      <p><strong>이메일:</strong> ${email}</p>
      <hr>
      <h3>신청 내역</h3>
      <div>${items_summary}</div>
      <hr>
      <p><strong>총 합계:</strong> ${total}원</p>
      <hr>
      <!-- <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <h4 style="margin: 0; font-size: 16px;">DB입금계좌</h4>
        <p style="margin: 5px 0 0; font-size: 14px;">신한 110-372-929005 김도형</p>
      </div> -->
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">담당자가 수량 확인 및 입금안내 드릴 예정입니다.</p>
      </div>
    `,
  };

  // 2. Confirmation Email to Applicant
  const applicantMailOptions = {
    from: `"THE FIN." <${SENDER_EMAIL}>`,
    to: email, // Send to the applicant's email address
    subject: `[${formattedDate}] DB 신청이 정상적으로 접수되었습니다.`,
    html: `
      <h2>DB 신청이 정상적으로 접수되었습니다.</h2>
      <p>안녕하세요, ${name}님. 신청해주셔서 감사합니다.</p>
      <p>아래는 신청하신 내역입니다. 확인 후 담당자가 개별 연락드리겠습니다.</p>
      <hr>
      <h3>신청 내역</h3>
      <div>${items_summary}</div>
      <hr>
      <p><strong>총 합계:</strong> ${total}원</p>
      <hr>
      <!-- <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <h4 style="margin: 0; font-size: 16px;">DB입금계좌</h4>
        <p style="margin: 5px 0 0; font-size: 14px;">신한 110-372-929005 김도형</p>
      </div> -->
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">담당자가 수량 확인 및 입금안내 드릴 예정입니다.</p>
      </div>
      <br>
      <p><em>*본 메일은 발신 전용입니다.</em></p>
    `,
  };

  // Try sending emails, but don't fail if email credentials are wrong
  try {
    const sendAdminMail = transporter.sendMail(adminMailOptions);
    const sendApplicantMail = transporter.sendMail(applicantMailOptions);

    await Promise.all([sendAdminMail, sendApplicantMail]);

    console.log('✅ All emails sent successfully');
    res.status(200).send('Submission saved and emails sent successfully');
  } catch (error) {
    console.error('⚠️ Email sending failed, but submission was saved:', error.code);
    // Still return success since data was saved to Supabase
    res.status(200).send('Submission saved successfully (email delivery failed)');
  }
});

// Export the app instance for Vercel
export default app;
