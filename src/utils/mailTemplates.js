// const otpTemplate = (name, otp) => `
// <!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8">
// </head>

// <body style="
// margin:0;
// padding:0;
// background:#f5f7fb;
// font-family:Arial,sans-serif;
// ">

// <table width="100%" cellpadding="0" cellspacing="0">
// <tr>
// <td align="center" style="padding:40px 20px;">

// <table width="600" cellpadding="0" cellspacing="0"
// style="
// background:white;
// border-radius:16px;
// overflow:hidden;
// ">

// <tr>
// <td align="center"
// style="
// background:#2563eb;
// padding:30px;
// ">

// <h1 style="color:white;margin:0;">
// Science Stories 🚀
// </h1>

// </td>
// </tr>

// <tr>
// <td style="padding:40px;">

// <h2>Hello ${name},</h2>

// <p>
// Use the following OTP to verify your email address:
// </p>

// <div
// style="
// margin:30px auto;
// width:220px;
// text-align:center;
// padding:20px;
// font-size:36px;
// font-weight:bold;
// letter-spacing:8px;
// background:#eff6ff;
// border-radius:12px;
// color:#2563eb;
// ">
// ${otp}
// </div>

// <p>
// This OTP is valid for
// <strong>5 minutes</strong>.
// </p>

// <p>
// If you did not request this code,
// please ignore this email.
// </p>

// <p>
// Regards,<br/>
// Science Stories Team
// </p>

// </td>
// </tr>

// </table>

// </td>
// </tr>
// </table>

// </body>
// </html>
// `;

// const resendOtpTemplate = (name, otp) => {
//   return `
// <!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>New OTP - Science Stories</title>
// </head>

// <body style="
//   margin:0;
//   padding:0;
//   background:#f5f7fb;
//   font-family:Arial, Helvetica, sans-serif;
// ">

// <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
// <tr>
// <td align="center">

// <table width="600" cellpadding="0" cellspacing="0" style="
//   background:#ffffff;
//   border-radius:16px;
//   overflow:hidden;
//   box-shadow:0 4px 20px rgba(0,0,0,0.08);
// ">

//   <!-- Header -->
//   <tr>
//     <td align="center" style="
//       background:linear-gradient(135deg,#2563eb,#1d4ed8);
//       padding:40px 20px;
//     ">
//       <h1 style="
//         color:white;
//         margin:0;
//         font-size:30px;
//       ">
//         🔄 OTP Resent
//       </h1>

//       <p style="
//         color:#dbeafe;
//         margin-top:10px;
//         font-size:15px;
//       ">
//         Science Stories Account Verification
//       </p>
//     </td>
//   </tr>

//   <!-- Content -->
//   <tr>
//     <td style="padding:40px;">

//       <h2 style="
//         color:#111827;
//         margin-top:0;
//       ">
//         Hello ${name}! 👋
//       </h2>

//       <p style="
//         color:#4b5563;
//         font-size:16px;
//         line-height:1.8;
//       ">
//         As requested, we've generated a new verification code for your
//         <strong>Science Stories</strong> account.
//       </p>

//       <p style="
//         color:#4b5563;
//         font-size:16px;
//         line-height:1.8;
//       ">
//         Use the OTP below to continue your verification process:
//       </p>

//       <!-- OTP Box -->
//       <table width="100%" cellpadding="0" cellspacing="0">
//         <tr>
//           <td align="center" style="padding:25px 0;">
//             <div style="
//               display:inline-block;
//               background:#eff6ff;
//               color:#1d4ed8;
//               font-size:34px;
//               font-weight:bold;
//               letter-spacing:8px;
//               padding:18px 35px;
//               border-radius:12px;
//               border:2px dashed #3b82f6;
//             ">
//               ${otp}
//             </div>
//           </td>
//         </tr>
//       </table>

//       <p style="
//         color:#ef4444;
//         font-size:15px;
//         margin-top:20px;
//       ">
//         ⏰ This OTP will expire in 5 minutes.
//       </p>

//       <p style="
//         color:#6b7280;
//         line-height:1.8;
//       ">
//         If you did not request a new OTP, you can safely ignore this email.
//       </p>

//       <p style="
//         color:#111827;
//         font-weight:bold;
//         margin-top:35px;
//       ">
//         Science Stories Team 🚀
//       </p>

//     </td>
//   </tr>

//   <!-- Footer -->
//   <tr>
//     <td align="center" style="
//       background:#f9fafb;
//       padding:25px;
//       color:#9ca3af;
//       font-size:12px;
//     ">
//       © ${new Date().getFullYear()} Science Stories.
//       All Rights Reserved.
//     </td>
//   </tr>

// </table>

// </td>
// </tr>
// </table>

// </body>
// </html>
// `;
// };

const otpTemplate = (name, otp, title, subtitle) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="
  background:#ffffff;
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
">

  <!-- Header -->
  <tr>
    <td align="center" style="
      background:linear-gradient(135deg,#2563eb,#1d4ed8);
      padding:40px 20px;
    ">
      <h1 style="
        color:white;
        margin:0;
        font-size:30px;
      ">
        🔐 ${title}
      </h1>

      <p style="
        color:#dbeafe;
        margin-top:10px;
        font-size:15px;
      ">
        ${subtitle}
      </p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px;">

      <h2 style="
        color:#111827;
        margin-top:0;
      ">
        Hello ${name}! 👋
      </h2>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.8;
      ">
        Please use the OTP below to continue.
      </p>

      <!-- OTP Box -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:25px 0;">
            <div style="
              display:inline-block;
              background:#eff6ff;
              color:#2563eb;
              font-size:34px;
              font-weight:bold;
              letter-spacing:8px;
              padding:18px 35px;
              border-radius:12px;
              border:2px dashed #3b82f6;
            ">
              ${otp}
            </div>
          </td>
        </tr>
      </table>

      <p style="
        color:#ef4444;
        font-size:15px;
        margin-top:20px;
      ">
        ⏰ This OTP will expire in 5 minutes.
      </p>

      <p style="
        color:#6b7280;
        line-height:1.8;
      ">
        For your security, do not share this OTP with anyone.
      </p>

      <p style="
        color:#6b7280;
        line-height:1.8;
      ">
        If you did not request this action, you can safely ignore this email.
      </p>

      <p style="
        color:#111827;
        font-weight:bold;
        margin-top:35px;
      ">
        Science Stories Team 🚀
      </p>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td align="center" style="
      background:#f9fafb;
      padding:25px;
      color:#9ca3af;
      font-size:12px;
    ">
      © ${new Date().getFullYear()} Science Stories.
      All Rights Reserved.
    </td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

const welcomeTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Science Stories</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="
  background:#ffffff;
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.08);
">

  <!-- Header -->
  <tr>
    <td align="center" style="
      background:linear-gradient(135deg,#2563eb,#1d4ed8);
      padding:40px 20px;
    ">
      <h1 style="
        color:#ffffff;
        margin:0;
        font-size:32px;
      ">
        🚀 Science Stories
      </h1>

      <p style="
        color:#dbeafe;
        margin-top:10px;
        font-size:16px;
      ">
        Learn Science Through Stories
      </p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px;">

      <h2 style="
        color:#111827;
        margin-top:0;
      ">
        Welcome, ${name}! 👋
      </h2>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.8;
      ">
        Congratulations! Your account has been successfully verified and created.
      </p>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.8;
      ">
        You're now part of a learning platform designed to make science fun,
        engaging, and easy to understand through inspiring stories and interactive quizzes.
      </p>

      <!-- Features -->
      <table width="100%" cellpadding="0" cellspacing="0" style="
        margin:30px 0;
        background:#f8fafc;
        border-radius:12px;
      ">
        <tr>
          <td style="padding:25px;">

            <p style="margin:10px 0;color:#1f2937;">
              📖 Explore stories of great scientists
            </p>

            <p style="margin:10px 0;color:#1f2937;">
              🧠 Take quizzes and test your knowledge
            </p>

            <p style="margin:10px 0;color:#1f2937;">
              📊 Track your learning progress
            </p>

            <p style="margin:10px 0;color:#1f2937;">
              🏆 Build a strong scientific foundation
            </p>

          </td>
        </tr>
      </table>

      <!-- Highlight Box -->
      <div style="
        background:#eff6ff;
        border-left:4px solid #2563eb;
        padding:20px;
        border-radius:8px;
      ">
        <p style="
          margin:0;
          color:#1e3a8a;
          font-size:15px;
          line-height:1.8;
        ">
          💡 Start your journey today by reading your first science story and completing its quiz.
        </p>
      </div>

      <p style="
        color:#6b7280;
        margin-top:35px;
        line-height:1.8;
      ">
        We're excited to be part of your learning journey.
      </p>

      <p style="
        color:#111827;
        font-weight:bold;
      ">
        Happy Learning! 🚀
      </p>

      <p style="
        color:#6b7280;
      ">
        — Science Stories Team
      </p>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td align="center" style="
      background:#f9fafb;
      padding:25px;
      color:#9ca3af;
      font-size:12px;
    ">
      © ${new Date().getFullYear()} Science Stories.
      All Rights Reserved.
    </td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
export { otpTemplate, welcomeTemplate };
