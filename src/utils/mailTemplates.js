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
<title>Welcome to Science Stories™ </title>
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

const welcomeTemplateSS = (name) => {
  const currentYear = new Date().getFullYear();
  const year = currentYear > 2026 ? `2026 - ${currentYear}` : "2026";
  return `<!doctype html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>Welcome to Science Stories</title>
    <!--[if mso
      ]><noscript
        ><xml
          ><o:OfficeDocumentSettings
            ><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings
          ></xml
        ></noscript
      ><!
    [endif]-->
    <style>
      /* client resets */
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0;
        mso-table-rspace: 0;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        height: 100% !important;
        background: #e7ecf1;
      }
      a {
        color: #1a3a5c;
      }
      /* mobile */
      @media only screen and (max-width: 620px) {
        .container {
          width: 100% !important;
        }
        .px {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .h1 {
          font-size: 26px !important;
          line-height: 1.2 !important;
        }
        .btn a {
          display: block !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: #e7ecf1">
    <!-- preheader (hidden) -->
    <div
      style="
        display: none;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        mso-hide: all;
        font-size: 1px;
        line-height: 1px;
        color: #e7ecf1;
      "
    >
      One question has a way of leading to the next. Come see where it
      goes.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background: #e7ecf1"
    >
      <tr>
        <td align="center" style="padding: 26px 12px">
          <table
            role="presentation"
            class="container"
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              width: 600px;
              max-width: 600px;
              background: #f5f0e8;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(12, 28, 48, 0.14);
            "
          >
            <!-- HEADER -->
            <tr>
              <td
                style="
                  background: #15294c;
                  border-bottom: 3px solid #b8872a;
                  padding: 26px 36px 24px;
                "
                class="px"
              >
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                >
                  <tr>
                    <td
                      style="
                        font-family:
                          Georgia, &quot;Times New Roman&quot;, serif;
                        color: #f4efe6;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 0.5px;
                      "
                    >
                      Science&nbsp;Stories<span
                        style="
                          color: #e6c884;
                          font-size: 12px;
                          vertical-align: super;
                        "
                        >&trade;</span
                      >
                    </td>
                    <td
                      align="right"
                      style="
                        font-family: Georgia, serif;
                        color: #e6c884;
                        font-size: 11px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                      "
                    >
                      Verified
                    </td>
                  </tr>
                </table>
                <div
                  style="
                    font-family: Georgia, serif;
                    color: #aebccb;
                    font-size: 13px;
                    font-style: italic;
                    margin-top: 6px;
                  "
                >
                  Science, as connected stories, not isolated facts
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td class="px" style="padding: 34px 36px 8px">
                <h1
                  class="h1"
                  style="
                    margin: 0 0 6px;
                    font-family: Georgia, &quot;Times New Roman&quot;, serif;
                    font-size: 30px;
                    line-height: 1.15;
                    color: #15294c;
                    font-weight: bold;
                  "
                >
                  Welcome, ${name}
                  <span style="font-weight: normal">&#128075;</span>
                </h1>
                <p
                  style="
                    margin: 0 0 6px;
                    font-family: Georgia, serif;
                    font-size: 16px;
                    line-height: 1.65;
                    color: #3d342a;
                  "
                >
                  Your account is verified &mdash; you&rsquo;re all set. Your
                  journey into the world of scientific discovery begins here.
                </p>
              </td>
            </tr>

            <!-- FEATURE LIST -->
            <tr>
              <td class="px" style="padding: 0 36px 6px">
                <p
                  style="
                    margin: 0 0 12px;
                    font-family: Georgia, serif;
                    font-size: 12px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: #b8872a;
                    font-weight: bold;
                  "
                >
                  What&rsquo;s waiting for you
                </p>
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                >
                  <!-- row -->
                  <tr>
                    <td width="34" valign="top" style="padding: 0 0 16px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                      >
                        <tr>
                          <td
                            width="24"
                            height="24"
                            align="center"
                            valign="middle"
                            style="
                              background: #b8872a;
                              border-radius: 12px;
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              color: #1a1410;
                              font-weight: bold;
                              line-height: 24px;
                            "
                          >
                            &#10003;
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td
                      valign="top"
                      style="
                        padding: 0 0 16px 12px;
                        font-family: Georgia, serif;
                        font-size: 15px;
                        line-height: 1.55;
                        color: #3d342a;
                      "
                    >
                      <b style="color: #15294c"
                        >Journey through six scientific eras</b
                      >
                      &mdash; follow a guided roadmap connecting scientists,
                      discoveries and the evolution of ideas.
                    </td>
                  </tr>
                  <tr>
                    <td width="34" valign="top" style="padding: 0 0 16px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                      >
                        <tr>
                          <td
                            width="24"
                            height="24"
                            align="center"
                            valign="middle"
                            style="
                              background: #b8872a;
                              border-radius: 12px;
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              color: #1a1410;
                              font-weight: bold;
                              line-height: 24px;
                            "
                          >
                            &#10003;
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td
                      valign="top"
                      style="
                        padding: 0 0 16px 12px;
                        font-family: Georgia, serif;
                        font-size: 15px;
                        line-height: 1.55;
                        color: #3d342a;
                      "
                    >
                      <b style="color: #15294c"
                        >Build a strong scientific foundation</b
                      >
                      &mdash; understand the fundamental concepts, principles
                      and discoveries that shape our understanding of the world.
                    </td>
                  </tr>
                  <tr>
                    <td width="34" valign="top" style="padding: 0 0 16px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                      >
                        <tr>
                          <td
                            width="24"
                            height="24"
                            align="center"
                            valign="middle"
                            style="
                              background: #b8872a;
                              border-radius: 12px;
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              color: #1a1410;
                              font-weight: bold;
                              line-height: 24px;
                            "
                          >
                            &#10003;
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td
                      valign="top"
                      style="
                        padding: 0 0 16px 12px;
                        font-family: Georgia, serif;
                        font-size: 15px;
                        line-height: 1.55;
                        color: #3d342a;
                      "
                    >
                      <b style="color: #15294c"
                        >Read or listen to every story</b
                      >
                      &mdash; explore at your own pace, with narration in a
                      voice you choose.
                    </td>
                  </tr>
                  <tr>
                    <td width="34" valign="top" style="padding: 0 0 16px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                      >
                        <tr>
                          <td
                            width="24"
                            height="24"
                            align="center"
                            valign="middle"
                            style="
                              background: #b8872a;
                              border-radius: 12px;
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              color: #1a1410;
                              font-weight: bold;
                              line-height: 24px;
                            "
                          >
                            &#10003;
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td
                      valign="top"
                      style="
                        padding: 0 0 16px 12px;
                        font-family: Georgia, serif;
                        font-size: 15px;
                        line-height: 1.55;
                        color: #3d342a;
                      "
                    >
                      <b style="color: #15294c"
                        >Explore, learn and test yourself</b
                      >
                      &mdash; challenge your understanding with quick quizzes
                      and discover connections to school and exam topics.
                    </td>
                  </tr>
                  <tr>
                    <td width="34" valign="top" style="padding: 0 0 2px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                      >
                        <tr>
                          <td
                            width="24"
                            height="24"
                            align="center"
                            valign="middle"
                            style="
                              background: #b8872a;
                              border-radius: 12px;
                              font-family: Arial, sans-serif;
                              font-size: 13px;
                              color: #1a1410;
                              font-weight: bold;
                              line-height: 24px;
                            "
                          >
                            &#10003;
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td
                      valign="top"
                      style="
                        padding: 0 0 2px 12px;
                        font-family: Georgia, serif;
                        font-size: 15px;
                        line-height: 1.55;
                        color: #3d342a;
                      "
                    >
                      <b style="color: #15294c">Watch your knowledge grow</b>
                      &mdash; track your progress as you travel through the map
                      of scientific discovery.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CALLOUT (no button) -->
            <tr>
              <td class="px" style="padding: 24px 36px 6px">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    background: #f3e8cf;
                    border: 1px solid #e3c98f;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 18px 22px;
                        font-family: Georgia, serif;
                        font-size: 16px;
                        line-height: 1.65;
                        color: #1a1410;
                        text-align: center;
                      "
                    >
                      <span style="color: #b8872a; font-weight: bold"
                        >Start your journey today</span
                      >
                      by reading your first science story and completing its
                      quiz.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- divider -->
            <tr>
              <td class="px" style="padding: 22px 36px 0">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                >
                  <tr>
                    <td
                      style="
                        border-top: 1px solid #cabfae;
                        font-size: 0;
                        line-height: 0;
                      "
                    >
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding: 16px 36px 4px">
                <p
                  style="
                    margin: 0 0 4px;
                    font-family: Georgia, serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #3d342a;
                  "
                >
                  Questions or need a hand? Reach us any time at
                  <a
                    href="mailto:support@sciencestories.in"
                    style="
                      color: #15294c;
                      font-weight: bold;
                      text-decoration: none;
                    "
                    >support@sciencestories.in</a
                  >.
                </p>
                <p
                  style="
                    margin: 14px 0 2px;
                    font-family: Georgia, serif;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #3d342a;
                  "
                >
                  Happy exploring,
                </p>
                <p
                  style="
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 15px;
                    line-height: 1.5;
                    color: #15294c;
                    font-weight: bold;
                  "
                >
                  The Science Stories<span
                    style="
                      font-size: 10px;
                      vertical-align: super;
                      color: #b8872a;
                    "
                    >&trade;</span
                  >
                  Team
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background: #15294c; padding: 22px 36px" class="px">
                <p
                  style="
                    margin: 0 0 8px;
                    font-family: Georgia, serif;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #8ea4bb;
                  "
                >
                  You&rsquo;re receiving this because you created a Science
                  Stories account.
                </p>
                <p
                  style="
                    margin: 0 0 10px;
                    font-family: Georgia, serif;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #8ea4bb;
                  "
                ></p>
                <p
                  style="
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #6a7f96;
                  "
                >
                  &copy; ${year} Science Voyage Studios LLP. All rights
                  reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

const otpTemplateSS = (name, otp) => {
  const currentYear = new Date().getFullYear();
  const year = currentYear > 2026 ? `2026 - ${currentYear}` : "2026";
  return `<!doctype html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>Verify your email — Science Stories</title>
    <!--[if mso
      ]><noscript
        ><xml
          ><o:OfficeDocumentSettings
            ><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings
          ></xml
        ></noscript
      ><!
    [endif]-->
    <style>
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0;
        mso-table-rspace: 0;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        height: 100% !important;
        background: #e7ecf1;
      }
      a {
        color: #1a3a5c;
      }
      @media only screen and (max-width: 620px) {
        .container {
          width: 100% !important;
        }
        .px {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .otp {
          font-size: 34px !important;
          letter-spacing: 10px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: #e7ecf1">
    <!-- preheader (hidden) -->
    <div
      style="
        display: none;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        mso-hide: all;
        font-size: 1px;
        line-height: 1px;
        color: #e7ecf1;
      "
    >
      Your Science Stories verification code is ${otp} — it expires in 5
      minutes.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background: #e7ecf1"
    >
      <tr>
        <td align="center" style="padding: 26px 12px">
          <table
            role="presentation"
            class="container"
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              width: 600px;
              max-width: 600px;
              background: #f5f0e8;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(12, 28, 48, 0.14);
            "
          >
            <!-- HEADER -->
            <tr>
              <td
                style="
                  background: #15294c;
                  border-bottom: 3px solid #b8872a;
                  padding: 26px 36px 24px;
                "
                class="px"
              >
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                >
                  <tr>
                    <td
                      style="
                        font-family:
                          Georgia, &quot;Times New Roman&quot;, serif;
                        color: #f4efe6;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 0.5px;
                      "
                    >
                      Science&nbsp;Stories<span
                        style="
                          color: #e6c884;
                          font-size: 12px;
                          vertical-align: super;
                        "
                        >&trade;</span
                      >
                    </td>
                    <td
                      align="right"
                      style="
                        font-family: Georgia, serif;
                        color: #e6c884;
                        font-size: 11px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                      "
                    >
                      Verify Email
                    </td>
                  </tr>
                </table>
                <div
                  style="
                    font-family: Georgia, serif;
                    color: #aebccb;
                    font-size: 13px;
                    font-style: italic;
                    margin-top: 6px;
                  "
                >
                  Complete your registration
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td class="px" style="padding: 34px 36px 6px">
                <h1
                  style="
                    margin: 0 0 6px;
                    font-family: Georgia, &quot;Times New Roman&quot;, serif;
                    font-size: 26px;
                    line-height: 1.2;
                    color: #15294c;
                    font-weight: bold;
                  "
                >
                  Hello, ${name}
                  <span style="font-weight: normal">&#128075;</span>
                </h1>
                <p
                  style="
                    margin: 0 0 6px;
                    font-family: Georgia, serif;
                    font-size: 16px;
                    line-height: 1.65;
                    color: #3d342a;
                  "
                >
                  Welcome aboard. Enter the code below to verify your email and
                  finish creating your account.
                </p>
              </td>
            </tr>

            <!-- OTP CODE BLOCK -->
            <tr>
              <td class="px" align="center" style="padding: 14px 36px 6px">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    background: #fbf8f1;
                    border: 1.5px solid #d6a646;
                    border-radius: 14px;
                  "
                >
                  <tr>
                    <td
                      align="center"
                      style="
                        padding: 20px 34px 8px;
                        font-family: Georgia, serif;
                        font-size: 11px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        color: #b8872a;
                        font-weight: bold;
                      "
                    >
                      Your verification code
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      class="otp"
                      style="
                        padding: 0 34px 20px;
                        font-family:
                          &quot;Courier New&quot;, Courier, monospace;
                        font-size: 42px;
                        line-height: 1;
                        letter-spacing: 14px;
                        font-weight: bold;
                        color: #15294c;
                      "
                    >
                      ${otp}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="px" align="center" style="padding: 12px 44px 2px">
                <p
                  style="
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #b45309;
                    font-weight: bold;
                  "
                >
                  This code expires in 5 minutes.
                </p>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding: 14px 40px 2px">
                <p
                  style="
                    margin: 0 0 8px;
                    font-family: Georgia, serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #7a6e65;
                    text-align: center;
                  "
                >
                  For your security, never share this code with anyone &mdash;
                  our team will never ask you for it.
                </p>
                <p
                  style="
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #7a6e65;
                    text-align: center;
                  "
                >
                  Didn&rsquo;t request this? You can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- divider -->
            <tr>
              <td class="px" style="padding: 22px 36px 0">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                >
                  <tr>
                    <td
                      style="
                        border-top: 1px solid #cabfae;
                        font-size: 0;
                        line-height: 0;
                      "
                    >
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding: 16px 36px 4px">
                <p
                  style="
                    margin: 0 0 4px;
                    font-family: Georgia, serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #3d342a;
                  "
                >
                  Need a hand? Reach us any time at
                  <a
                    href="mailto:support@sciencestories.in"
                    style="
                      color: #15294c;
                      font-weight: bold;
                      text-decoration: none;
                    "
                    >support@sciencestories.in</a
                  >.
                </p>
                <p
                  style="
                    margin: 14px 0 2px;
                    font-family: Georgia, serif;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #3d342a;
                  "
                >
                  Happy exploring,
                </p>
                <p
                  style="
                    margin: 0 0 2px;
                    font-family: Georgia, serif;
                    font-size: 15px;
                    line-height: 1.5;
                    color: #15294c;
                    font-weight: bold;
                  "
                >
                  The Science Stories<span
                    style="
                      font-size: 10px;
                      vertical-align: super;
                      color: #b8872a;
                    "
                    >&trade;</span
                  >
                  Team
                </p>
                <p
                  style="
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #7a6e65;
                  "
                >
                  Science Voyage Studios LLP
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background: #15294c; padding: 22px 36px" class="px">
                <p
                  style="
                    margin: 0 0 8px;
                    font-family: Georgia, serif;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #8ea4bb;
                  "
                >
                  This is an automated security message for your Science Stories
                  account.
                </p>
                <p
                  style="
                    margin: 0 0 10px;
                    font-family: Georgia, serif;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #8ea4bb;
                  "
                ></p>
                <p
                  style="
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #6a7f96;
                  "
                >
                  &copy; ${year} Science Voyage Studios LLP. All rights
                  reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};
export { otpTemplate, welcomeTemplate, welcomeTemplateSS, otpTemplateSS };
