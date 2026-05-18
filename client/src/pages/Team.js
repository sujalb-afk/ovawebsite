import React from 'react';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { getOptimizedImageUrl } from '../utils/imageUrl';

function getInitials(name) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function TeamAvatar({ name, img }) {
  const [imgError, setImgError] = React.useState(false);
  if (img && !imgError) {
    return (
      <div className="team-avatar team-avatar-photo" aria-label={name}>
        <img src={getOptimizedImageUrl(img)} alt={name} width={120} height={120} loading="lazy" decoding="async" onError={(e) => { if (e.target.src !== img) { e.target.src = img; e.target.onerror = null; return; } setImgError(true); }} />
      </div>
    );
  }
  return (
    <div className="team-avatar" aria-label={name}>
      {getInitials(name)}
    </div>
  );
}

function Team() {
  const teamMembers = [
    {
      name: 'Rajendra Dure',
      role: 'Operations',
      bio: 'Mr. Rajendra Dure is a dedicated member of the OVA™ team, bringing expertise in operations, exploring new areas of implementation, and program coordination. With a strong background in operations and logistics, he plays a key role in optimizing processes and ensuring the efficient execution of initiatives within the organization.',
      img: '/images/team/rajendra-dure.webp'
    },
    {
      name: 'Dr Vaishali Iti',
      role: 'Technologist',
      bio: 'Dr Vaishali Iti is a dedicated and passionate member of the OVA™ team, specializing in community engagement and program coordination. With a strong foundation in computer science and technology, she holds a PhD in Blockchain and serves as a professor, contributing her expertise to drive innovation and foster impactful initiatives within the organization.',
      img: '/images/team/dr-vaishali-iti.webp'
    },
    {
      name: 'Mangesh Narvekar',
      role: 'Legal and Compliance Officer',
      bio: 'Mangesh Narvekar is a dedicated member of the OVA™ team, offering his expertise as a Company Secretary with a solid foundation in law, holding an LLB degree. His knowledge in corporate governance, compliance, and legal frameworks ensures that the organization\'s operations align with ethical and regulatory standards, contributing to its growth and integrity.',
      img: '/images/team/mangesh-narvekar.webp'
    },
    {
      name: 'Dr R. V. Kulkarni',
      role: 'Advisor',
      bio: 'Dr R. V. Kulkarni serves as the Advisor for the OVA™, offering strategic guidance and expert insights to drive the organization\'s vision and mission. With a wealth of experience and profound knowledge, Dr. Kulkarni plays a pivotal role in shaping impactful programs and fostering sustainable growth within the organization.',
      img: '/images/team/dr-rv-kulkarni.webp'
    },
    {
      name: 'Sagar Awale',
      role: 'Active Member - Technology and Innovation',
      bio: 'Sagar Awale is a dedicated member of the OVA™ team, overseeing technology deployment and support as well as driving new initiatives. With a keen focus on innovation and efficiency, he ensures the seamless integration of technology to enhance the organization\'s operations and expand its impact.',
      img: '/images/team/sagar-awale.webp'
    },
    {
      name: 'Adv Satish Iti',
      role: 'Legal and Volunteer Engagement',
      bio: 'Satish Iti is a skilled lawyer and an active member of the OVA™ team. In addition to providing legal guidance, he plays a key role in recruiting new volunteers and aligning activities to support the organization\'s mission. His combined legal expertise and commitment to community engagement help drive the association\'s growth and impact.',
      img: '/images/team/satish-iti.webp'
    },
    {
      name: 'Vishal V. Narvekar',
      role: 'Founder',
      bio: 'Vishal Narvekar is the Founder and Strategist of the OVA™ (Bharatiya Open Volunteer Association). He is passionate about climate change and global issues, guiding the organization to focus on meaningful initiatives that make a positive impact.',
      img: '/images/team/vishal-narvekar.webp'
    },
    {
      name: 'Dr Ravindra Shinde',
      role: 'Scientist and Sustainability Advisor',
      bio: 'Dr Ravindra Shinde is a Scientist and an active member of the OVA™ (Bharatiya Open Volunteer Association). With a strong focus on climate change, he contributes to the organization\'s environmental sustainability initiatives, conducting research and promoting solutions to mitigate climate-related challenges. Dr. Shinde is dedicated to advancing scientific understanding and practical actions that benefit communities and the environment.',
      img: '/images/team/dr-ravindra-shinde.webp'
    },
  ];

  return (
    <div className="team-page-wrap">
      <SEO
        title="Our Team · Meet the Changemakers"
        description="Meet the OVA™ team - dedicated volunteers and experts driving community empowerment. From operations to technology, sustainability to legal compliance."
        canonical="/team"
        keywords="OVA™ team, NGO volunteers, OVA™ team members"
      />

      {/* ── Hero – same size and style as Services page ── */}
      <section className="about-hero donate-hero-style">
        <AboutHeroBg className="donate-hero-bg" />
        <div className="about-hero-overlay donate-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content donate-hero-content">
            <h1 className="about-hero-title">Our Team</h1>
            <p className="about-hero-subtext">
              The hearts and hands behind our vision: dedicated changemakers driving impact.
            </p>
          </div>
        </div>
      </section>

      {/* ── Team grid: green card (photo, name, role) + white card (bio). Keep this layout as-is (e.g. R. V. Kulkarni). ── */}
      <section className="team-section">
        <div className="team-grid">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="team-member-card">
              {/* Left - identity panel */}
              <div className="tmc-left">
                <TeamAvatar name={member.name} img={member.img} />
                <h3 className="tmc-name">{member.name}</h3>
                <span className="tmc-role">{member.role}</span>
              </div>
              {/* Right - bio panel */}
              <div className="tmc-right">
                <p className="tmc-bio">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Team;
