import Link from 'next/link'
import '../globals.css'

export default function PrivacyPolicy() {
  return (
    <main style={{ padding: '40px 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '40px', color: 'var(--primary-color)' }}>
          ← Back to Home
        </Link>
        
        <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '16px' }}>
              Welcome to Focus Circle ("we," "our," or "us"). Focus Circle is operated by Professor Cat Limited, 
              a company registered in Hong Kong. We are committed to protecting your privacy and ensuring you have 
              a positive experience when using our mobile application ("App").
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our App. Please read this Privacy Policy carefully. If you do not agree with the terms of this 
              Privacy Policy, please do not access the App.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>2. Information We Collect</h2>
            
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginTop: '24px', marginBottom: '12px' }}>2.1 Information You Provide</h3>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Account Information:</strong> When you create an account, we collect your email address, name, and authentication credentials (handled securely through Supabase Auth).</li>
              <li style={{ marginBottom: '8px' }}><strong>User Content:</strong> Ideas, notes, todos, categories, and other content you create within the App.</li>
              <li style={{ marginBottom: '8px' }}><strong>Voice Recordings:</strong> Audio recordings you make using the App's voice recording feature.</li>
            </ul>

            <h3 style={{ fontSize: '20px', fontWeight: 600, marginTop: '24px', marginBottom: '12px' }}>2.2 Automatically Collected Information</h3>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Usage Data:</strong> Information about how you use the App, including features accessed and time spent.</li>
              <li style={{ marginBottom: '8px' }}><strong>Device Information:</strong> Device type, operating system, and unique device identifiers.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: '16px' }}>We use the information we collect to:</p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Provide, maintain, and improve the App's functionality</li>
              <li style={{ marginBottom: '8px' }}>Process and transcribe your voice recordings</li>
              <li style={{ marginBottom: '8px' }}>Provide AI-powered categorization and semantic search features</li>
              <li style={{ marginBottom: '8px' }}>Manage your account and authenticate your identity</li>
              <li style={{ marginBottom: '8px' }}>Send you important updates and notifications</li>
              <li style={{ marginBottom: '8px' }}>Respond to your inquiries and provide customer support</li>
              <li style={{ marginBottom: '8px' }}>Detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>4. Third-Party Services</h2>
            <p style={{ marginBottom: '16px' }}>We use the following third-party services that may collect information:</p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Supabase:</strong> Authentication, database, and storage services. See Supabase's privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a></li>
              <li style={{ marginBottom: '8px' }}><strong>Deepgram:</strong> Voice transcription services. See Deepgram's privacy policy: <a href="https://deepgram.com/privacy" target="_blank" rel="noopener noreferrer">https://deepgram.com/privacy</a></li>
              <li style={{ marginBottom: '8px' }}><strong>AIMLAPI:</strong> AI services for embeddings and categorization. See AIMLAPI's privacy policy.</li>
              <li style={{ marginBottom: '8px' }}><strong>Google Sign-In / Apple Sign-In:</strong> Authentication providers. See their respective privacy policies.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>5. Data Storage and Security</h2>
            <p style={{ marginBottom: '16px' }}>
              We implement appropriate technical and organizational measures to protect your personal information. 
              Your data is stored securely using Supabase's infrastructure, which employs industry-standard security 
              practices including encryption at rest and in transit.
            </p>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
              strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>6. Your Rights</h2>
            <p style={{ marginBottom: '16px' }}>You have the right to:</p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Access and receive a copy of your personal data</li>
              <li style={{ marginBottom: '8px' }}>Rectify inaccurate or incomplete data</li>
              <li style={{ marginBottom: '8px' }}>Request deletion of your personal data</li>
              <li style={{ marginBottom: '8px' }}>Export your data in a portable format</li>
              <li style={{ marginBottom: '8px' }}>Withdraw consent for data processing</li>
              <li style={{ marginBottom: '8px' }}>Object to certain types of data processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us at <a href="mailto:privacy@focuscircle.app">privacy@focuscircle.app</a>.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide the App's services and fulfill 
              the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. 
              When you delete your account, we will delete or anonymize your personal information, except where we are 
              required to retain it for legal purposes.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>8. Children's Privacy</h2>
            <p>
              Our App is not intended for children under the age of 13. We do not knowingly collect personal information 
              from children under 13. If you are a parent or guardian and believe your child has provided us with personal 
              information, please contact us immediately.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy 
              Policy periodically for any changes.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>10. Contact Us</h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p>
              <strong>Professor Cat Limited</strong><br />
              Email: <a href="mailto:privacy@focuscircle.app">privacy@focuscircle.app</a><br />
              Support: <a href="mailto:support@focuscircle.app">support@focuscircle.app</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

