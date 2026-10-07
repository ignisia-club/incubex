import { config } from 'dotenv';
import { Client, Databases, Query } from 'node-appwrite';
import { createClient } from '@supabase/supabase-js';

// Load both .env files
config({ path: '../ignisia-club-os/.env' });
config({ path: './.env' });

const DATABASE_ID = 'ignisia';
const TABLES = { eventRegs: 'event_regs' };

const appwrite = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(appwrite);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Syncing teams from Appwrite to Supabase...');
  let offset = 0;
  const limit = 100;
  let total = 0;

  while (true) {
    const res = await db.listDocuments(DATABASE_ID, TABLES.eventRegs, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (res.documents.length === 0) break;

    const teamsToInsert = res.documents
      .filter(d => d.teamNo && d.teamPin)
      .map(d => {
         let tName = d.teamName;
         let tEmail = null;
         try {
            const membersStr = Array.isArray(d.members) ? d.members[0] : d.members;
            if (typeof membersStr === 'string' && membersStr.startsWith('[')) {
               const members = JSON.parse(membersStr);
               const leader = members.find(m => m.leader) || members[0];
               if (leader) {
                  if (!tName) tName = leader.name + "'s team";
                  tEmail = leader.email;
               }
            }
         } catch(e) { console.error('Parse error for', d.teamNo, e); }
         
         return {
            team_id: String(d.teamNo).toUpperCase(),
            team_pin: String(d.teamPin),
            team_name: tName || 'Unnamed Team',
            leader_email: tEmail
         };
      });

    if (teamsToInsert.length > 0) {
      const { error } = await supabase.from('teams').upsert(teamsToInsert, { onConflict: 'team_id' });
      if (error) { console.error('Error inserting to Supabase:', error); }
      else { total += teamsToInsert.length; console.log(`Synced ${teamsToInsert.length} teams...`); }
    }
    offset += limit;
  }
  console.log(`Sync complete! ${total} total teams securely pushed to Supabase.`);
}

main().catch(console.error);
