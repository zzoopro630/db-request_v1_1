import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const port = 3001;

// IMPORTANT: For production, use environment variables to store sensitive data.
const SENDER_EMAIL = 'ads.thefin@gmail.com';
const SENDER_APP_PASSWORD = 'ahcd stkm inhk yeks';
const RECIPIENT_EMAIL = 'songnakjoo@gmail.com';

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:8081']
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

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.post('/send-email', async (req, res) => {
  const { name, affiliation, phone, email, items_summary, total } = req.body;
  const formattedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Email to Admin
  const adminMailOptions = {
    from: `"DB 신청폼" <${SENDER_EMAIL}>`,
    to: RECIPIENT_EMAIL,
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
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <h4 style="margin: 0; font-size: 16px;">DB입금계좌</h4>
        <p style="margin: 5px 0 0; font-size: 14px;">신한 110-372-929005 김도형</p>
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
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <h4 style="margin: 0; font-size: 16px;">DB입금계좌</h4>
        <p style="margin: 5px 0 0; font-size: 14px;">신한 110-372-929005 김도형</p>
      </div>
      <br>
      <p><em>*본 메일은 발신 전용입니다.</em></p>
    `,
  };

  try {
    const sendAdminMail = transporter.sendMail(adminMailOptions);
    const sendApplicantMail = transporter.sendMail(applicantMailOptions);

    await Promise.all([sendAdminMail, sendApplicantMail]);

    console.log('All emails sent successfully');
    res.status(200).send('Emails sent successfully');
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).send(error.toString());
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});