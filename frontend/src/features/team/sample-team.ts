import type { TeamMember } from "./types/team-member.types";

const TEST_MEMBER_BIO = `<table><tbody>
<tr><td>Role</td><td>Co-Founder &amp; Licensed Trekking Guide</td></tr>
<tr><td>Company</td><td>Joyful Trekking Pvt. Ltd.</td></tr>
<tr><td>Training</td><td>Nepal Academy of Tourism and Hotel Management</td></tr>
<tr><td>Expertise</td><td>Himalayan trekking, mountain culture and heritage</td></tr>
<tr><td>Specialty</td><td>Everest, Annapurna and Langtang region treks</td></tr>
<tr><td>Primary Destinations</td><td>Kathmandu, Pokhara, Everest Base Camp &amp; Annapurna</td></tr>
<tr><td>Languages</td><td>English, Nepali</td></tr>
<tr><td>Company Contribution</td><td>Leads treks and helps travelers experience Nepal through culture and the mountains</td></tr>
</tbody></table>
<p><strong>This is a dummy team member used to test the team page layout.</strong> Replace it by adding real members in the admin panel.</p>
<p>Test Member has a wealth of knowledge about Nepal's mountains, culture and history, and enjoys sharing it with travelers from around the world. Friendly, patient and well prepared, every trek becomes an easy and memorable one.</p>
<h3>Certificate &amp; Achievements</h3>
<p><img src="/images/gallery/everest-1.jpg" alt=""> <img src="/images/gallery/everest-2.jpg" alt=""> <img src="/images/gallery/everest-3.jpg" alt=""> <img src="/images/gallery/everest-4.jpg" alt=""></p>`;

/**
 * Placeholder roster shown when the API is unreachable or has no team
 * members yet (see `SHOW_SAMPLE_DATA`). No photos on purpose, so nothing here
 * can be mistaken for a real person. Only the "Test Member" has a page
 * (`/company/team/test-member`), for trying the member layout.
 */
const SAMPLE: Array<[string, string]> = [
  ["Team Member One", "Managing Director"],
  ["Team Member Two", "Operations Manager"],
  ["Team Member Three", "Senior Trekking Guide"],
  ["Team Member Four", "Tour Leader"],
  ["Team Member Five", "Reservations Officer"],
  ["Team Member Six", "Customer Support"],
];

const TEST_MEMBER: TeamMember = {
  id: "sample-member-test",
  fullName: "Test Member",
  position: "Co-Founder / Trekking Guide",
  positionOrder: 0,
  photoUrl: null,
  memberPhone: "+977 9845000000",
  memberEmail: "joyfultrekking@gmail.com",
  description: TEST_MEMBER_BIO,
  slug: "test-member",
};

export const SAMPLE_TEAM_MEMBERS: TeamMember[] = [TEST_MEMBER, ...SAMPLE.map(([fullName, position], index) => ({
  id: `sample-member-${index + 1}`,
  fullName,
  position,
  positionOrder: index + 1,
  photoUrl: null,
  memberPhone: null,
  memberEmail: null,
  description: null,
  slug: null,
}))];
