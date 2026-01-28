import nodemailer from 'nodemailer';

// Create reusable transporter - will be initialized on first use
let transporter: any = null;

async function getTransporter() {
  if (transporter) return transporter;

  // If no SMTP credentials provided, create a test account
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('📧 No SMTP credentials found. Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();

    console.log('\n✅ Ethereal Email Test Account Created!');
    console.log('─'.repeat(60));
    console.log('View sent emails at: https://ethereal.email/messages');
    console.log('Login with:');
    console.log('  Email:', testAccount.user);
    console.log('  Password:', testAccount.pass);
    console.log('─'.repeat(60) + '\n');

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // Use provided SMTP credentials
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const transporter = await getTransporter();

    // Get sender email
    const fromEmail = process.env.SMTP_USER || 'noreply@agency.local';

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Agency Services'}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    });

    console.log('✅ Email sent:', info.messageId);

    // If using Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email: ' + previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Generate HTML for invoice email
export function generateInvoiceEmailHTML(invoice: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .invoice-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f4f4f4; }
        .total { font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice ${invoice.invoiceNumber}</h1>
        </div>
        <div class="content">
          <p>Dear ${invoice.client.name},</p>
          <p>Please find your invoice details below:</p>

          <div class="invoice-details">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toLocaleString()}</td>
                  <td>$${item.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                <td>$${invoice.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Tax:</strong></td>
                <td>$${invoice.tax.toLocaleString()}</td>
              </tr>
              <tr class="total">
                <td colspan="3" style="text-align: right;">Total:</td>
                <td>$${invoice.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Agency Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
