const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send notification when bug ticket is created
   * @param {Object} ticketData - Created ticket information
   * @param {string} assigneeEmail - Email of assigned developer
   */
  async sendTicketCreatedNotification(ticketData, assigneeEmail) {
    try {
      const { key, url, summary, priority } = ticketData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: assigneeEmail,
        subject: `[BugSense AI] New Bug Assigned: ${key}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🐛 New Bug Ticket Assigned</h2>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Ticket Details</h3>
              <p><strong>Ticket:</strong> <a href="${url}">${key}</a></p>
              <p><strong>Summary:</strong> ${summary}</p>
              <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(priority)};">${priority}</span></p>
            </div>

            <p>This ticket was automatically generated and analyzed by BugSense AI.</p>
            
            <p style="margin-top: 30px;">
              <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Ticket in JIRA
              </a>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated message from BugSense AI. Please do not reply to this email.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${assigneeEmail} for ticket ${key}`);
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw - email is nice-to-have
    }
  }

  /**
   * Send notification when bug analysis is complete
   * @param {string} qaEmail - QA engineer's email
   * @param {Object} analysisData - Bug analysis results
   */
  async sendAnalysisCompleteNotification(qaEmail, analysisData) {
    try {
      const { summary, jiraTicket } = analysisData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: qaEmail,
        subject: `[BugSense AI] Analysis Complete: ${summary}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ Bug Analysis Complete</h2>
            
            <p>Your bug report has been analyzed and a JIRA ticket has been created.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Summary:</strong> ${summary}</p>
              ${jiraTicket ? `<p><strong>JIRA Ticket:</strong> <a href="${jiraTicket.url}">${jiraTicket.key}</a></p>` : ''}
            </div>

            <p style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View in BugSense AI
              </a>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated message from BugSense AI. Please do not reply to this email.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${qaEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  getPriorityColor(priority) {
    const colors = {
      'Critical': '#dc2626',
      'High': '#ea580c',
      'Medium': '#eab308',
      'Low': '#10b981'
    };
    return colors[priority] || '#6b7280';
  }
}

module.exports = new EmailService();
