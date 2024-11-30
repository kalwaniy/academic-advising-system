import nodemailer from 'nodemailer';

// Configure the email transporter with Mailtrap
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io', // Mailtrap's SMTP host
  port: 2525, // Mailtrap's port
  auth: {
    user: 'c2dd4f04278768', // Replace with your Mailtrap username
    pass: '4a6ca5be4d99c2', // Replace with your Mailtrap password
  },
});

// Function to send an email
export const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: 'yash.kalwani777@gmail.com', // Sender's email address (doesn't need to be real for Mailtrap)
      to, // Recipient's email address
      subject, // Email subject
      text, // Email body
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (err) {
    console.error('Error sending email:', err);
  }
};
