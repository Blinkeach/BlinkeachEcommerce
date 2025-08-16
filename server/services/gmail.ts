import nodemailer from 'nodemailer';

// Check if required environment variables are set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('EMAIL_USER or EMAIL_PASSWORD environment variables are not set. Email services will not work.');
}

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Company info
const COMPANY_NAME = 'Blinkeach';

/**
 * Send email using Gmail
 */
export async function sendGmailEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send OTP verification email
 * @param email - The recipient email address
 * @param otp - The OTP code
 * @param type - The type of verification ('Email Verification' or 'Password Reset')
 */
export async function sendOTPVerificationEmail(
  email: string, 
  otp: string, 
  type: 'Email Verification' | 'Password Reset' = 'Email Verification'
): Promise<boolean> {
  const isPasswordReset = type === 'Password Reset';
  const subject = `Your ${COMPANY_NAME} ${isPasswordReset ? 'Password Reset' : 'Verification'} Code`;
  
  // Generate HTML email body
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1F51A9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">${isPasswordReset ? 'Password Reset' : 'Verification'} Code</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e1e1e1; border-top: none; text-align: center;">
        <p>Hello,</p>
        <p>Your ${isPasswordReset ? 'password reset' : 'verification'} code for ${COMPANY_NAME} is:</p>
        <div style="margin: 30px 0; background-color: #f8f8f8; padding: 20px; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        ${isPasswordReset 
          ? `<p>If you didn't request to reset your password, please ignore this email and ensure your account is secure.</p>` 
          : `<p>If you didn't request this code, please ignore this email.</p>`
        }
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777;">
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    ${isPasswordReset ? 'Password Reset' : 'Verification'} Code
    
    Hello,
    
    Your ${isPasswordReset ? 'password reset' : 'verification'} code for ${COMPANY_NAME} is: ${otp}
    
    This code will expire in 10 minutes.
    
    ${isPasswordReset 
      ? `If you didn't request to reset your password, please ignore this email and ensure your account is secure.` 
      : `If you didn't request this code, please ignore this email.`
    }
    
    © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
  `;
  
  return sendGmailEmail(email, subject, text, html);
}

// Verify the Gmail connection on startup
transporter.verify()
  .then(() => {
    console.log('Gmail server is ready to send messages');
  })
  .catch((error) => {
    console.error('Gmail connection error:', error);
  });