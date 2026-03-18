import 'dotenv/config';
import { db, pool } from './db';
import { matches, commentary } from './schema';

// ─── Teams ────────────────────────────────────────────────────────────────────

const TEAMS: Record<string, string[]> = {
  football: [
    'Arsenal', 'Chelsea', 'Manchester City', 'Liverpool', 'Manchester United',
    'Tottenham', 'Newcastle', 'Aston Villa', 'West Ham', 'Brighton',
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia',
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Wolfsburg',
    'PSG', 'Marseille', 'Lyon', 'Monaco', 'Nice',
    'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma',
    'Ajax', 'Feyenoord', 'PSV', 'Benfica', 'Porto',
    'Celtic', 'Rangers', 'Galatasaray', 'Fenerbahce', 'Besiktas',
  ],
  tennis: [
    'Novak Djokovic', 'Carlos Alcaraz', 'Jannik Sinner', 'Daniil Medvedev',
    'Rafael Nadal', 'Roger Federer', 'Andy Murray', 'Stan Wawrinka',
    'Alexander Zverev', 'Stefanos Tsitsipas', 'Casper Ruud', 'Taylor Fritz',
    'Holger Rune', 'Ben Shelton', 'Frances Tiafoe', 'Sebastian Korda',
    'Iga Swiatek', 'Aryna Sabalenka', 'Coco Gauff', 'Elena Rybakina',
    'Jessica Pegula', 'Madison Keys', 'Barbora Krejcikova', 'Qinwen Zheng',
  ],
  basketball: [
    'LA Lakers', 'Golden State Warriors', 'Boston Celtics', 'Miami Heat',
    'Milwaukee Bucks', 'Phoenix Suns', 'Denver Nuggets', 'Dallas Mavericks',
    'Brooklyn Nets', 'Philadelphia 76ers', 'Chicago Bulls', 'Toronto Raptors',
    'Atlanta Hawks', 'Cleveland Cavaliers', 'New York Knicks', 'Orlando Magic',
    'Memphis Grizzlies', 'New Orleans Pelicans', 'Oklahoma City Thunder', 'Sacramento Kings',
  ],
  cricket: [
    'India', 'Australia', 'England', 'Pakistan', 'South Africa',
    'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan',
    'Zimbabwe', 'Ireland', 'Scotland', 'Netherlands', 'UAE',
    'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
    'Kolkata Knight Riders', 'Delhi Capitals', 'Sunrisers Hyderabad',
    'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans',
  ],
  rugby: [
    'New Zealand All Blacks', 'South Africa Springboks', 'England', 'Ireland',
    'France', 'Australia Wallabies', 'Wales', 'Scotland',
    'Argentina', 'Fiji', 'Samoa', 'Japan',
  ],
  baseball: [
    'New York Yankees', 'LA Dodgers', 'Boston Red Sox', 'Chicago Cubs',
    'Houston Astros', 'Atlanta Braves', 'San Francisco Giants', 'St. Louis Cardinals',
    'Toronto Blue Jays', 'Seattle Mariners', 'Tampa Bay Rays', 'San Diego Padres',
  ],
};

// ─── Commentary templates ──────────────────────────────────────────────────────

const COMMENTARY: Record<string, Array<{ eventType: string; templates: string[]; actor?: boolean; team?: boolean }>> = {
  football: [
    { eventType: 'kickoff',      templates: ['Kick off! {home} get us underway.', 'We are underway! {away} kick off.', 'The referee blows the whistle — we are off!'] },
    { eventType: 'goal',         actor: true, team: true, templates: [
      'GOAL! {actor} fires it into the back of the net! What a strike!',
      'GOAL! {actor} with a clinical finish. {team} take the lead!',
      'GOAL! Brilliant work from {actor} — {team} are ahead!',
      '{actor} SCORES! Unstoppable effort from the {team} forward!',
      'GOLAZO! {actor} with an absolutely stunning goal for {team}!',
    ]},
    { eventType: 'yellow_card',  actor: true, team: true, templates: [
      'Yellow card for {actor} after a reckless challenge.',
      '{actor} is booked. The referee had no hesitation.',
      'Caution for {actor} of {team}. They will need to be careful.',
    ]},
    { eventType: 'red_card',     actor: true, team: true, templates: [
      'RED CARD! {actor} is sent off! {team} are down to ten men!',
      'Off he goes! {actor} receives a straight red. Terrible challenge.',
      'RED CARD! {actor} lunges in two-footed. {team} in serious trouble now.',
    ]},
    { eventType: 'substitution', actor: true, team: true, templates: [
      'Substitution: {actor} comes on for {team}.',
      '{team} make a change — {actor} is introduced.',
      'Fresh legs for {team} as {actor} enters the fray.',
    ]},
    { eventType: 'var',          templates: ['VAR check underway for a possible offside.', 'The referee consults the VAR. The crowd holds its breath.', 'Video review in progress — the goal is being checked.'] },
    { eventType: 'offside',      templates: ['Offside! The flag goes up.', 'No goal — tight offside call after the VAR review.', 'Ruled out for offside. Agonising for the attacking side.'] },
    { eventType: 'penalty',      actor: true, team: true, templates: [
      'PENALTY! {actor} steps up for {team}.',
      'Spot kick awarded to {team}! {actor} will take it.',
    ]},
    { eventType: 'halftime',     templates: ['Half time! What a 45 minutes of action.', 'The referee brings the first half to a close.', 'Half time. Both teams head to the tunnel.'] },
    { eventType: 'fulltime',     templates: ['Full time! What a match that was.', 'The final whistle blows. An incredible game of football.', 'Full time. The players embrace at the final whistle.'] },
    { eventType: 'foul',         actor: true, templates: ['Foul by {actor}. Free kick awarded.', '{actor} brings down his man. Free kick to the opposition.'] },
    { eventType: 'injury',       actor: true, templates: ['{actor} is down holding his leg. Medical staff rush on.', 'There are concerns for {actor} — they look in some discomfort.'] },
  ],
  tennis: [
    { eventType: 'kickoff',      templates: ['{home} serves first. Match underway!', 'The umpire calls play — we are off!'] },
    { eventType: 'ace',          actor: true, templates: ['ACE! {actor} fires down an unreturnable serve!', 'ACE! {actor} with a booming delivery — no chance for the returner!'] },
    { eventType: 'double_fault', actor: true, templates: ['Double fault from {actor}. Gift of a point.', '{actor} sends the second serve long. Double fault.'] },
    { eventType: 'break_point',  actor: true, templates: ['BREAK! {actor} converts the break point with a stunning winner!', 'Break of serve! {actor} takes full advantage.'] },
    { eventType: 'fulltime',     templates: ['Set over! A thrilling set of tennis.', 'That set goes to the baseline grinder.'] },
    { eventType: 'injury',       actor: true, templates: ['{actor} calls for the trainer. A concerning moment.'] },
  ],
  basketball: [
    { eventType: 'kickoff',    templates: ['Tip-off! We are underway at the arena.', 'The ball is in the air — tip-off!'] },
    { eventType: 'goal',       actor: true, team: true, templates: [
      '{actor} with the mid-range jumper! {team} extend their lead.',
      'Three pointer! {actor} from downtown — {team} fans go wild!',
      '{actor} drives baseline and lays it in. {team} on a run!',
      'And one! {actor} draws the foul and completes the play for {team}.',
      '{actor} with the slam dunk! {team} dominating the paint.',
    ]},
    { eventType: 'foul',       actor: true, templates: ['Foul on {actor}. Free throws incoming.', 'Personal foul called on {actor}.'] },
    { eventType: 'substitution', actor: true, team: true, templates: ['{actor} checks in for {team}. Coach making a tactical move.'] },
    { eventType: 'fulltime',   templates: ['Buzzer sounds! Final quarter done.', 'Game over! What a contest that was.'] },
  ],
  cricket: [
    { eventType: 'kickoff',    templates: ['{home} win the toss and elect to bat.', '{away} win the toss and choose to field.'] },
    { eventType: 'wicket',     actor: true, team: true, templates: [
      'WICKET! {actor} bowls the batter out! {team} strike!',
      'WICKET! Caught behind! {actor} celebrates for {team}!',
      'OUT! LBW! {actor} with the breakthrough for {team}!',
      'WICKET! {actor} takes a stunning catch at slip! {team} on fire!',
    ]},
    { eventType: 'boundary',   actor: true, templates: [
      'FOUR! {actor} drives through the covers magnificently!',
      'FOUR! {actor} pulls off his hip — beautiful timing.',
      'FOUR! {actor} cuts hard through point. Brilliant shot!',
    ]},
    { eventType: 'six',        actor: true, templates: [
      'SIX! {actor} launches it over long-on! The crowd erupts!',
      'SIX! {actor} goes downtown over mid-wicket. Enormous hit!',
      'MAXIMUM! {actor} sends it into the upper tier!',
    ]},
    { eventType: 'fulltime',   templates: ['Innings over! What a partnership we witnessed.', 'End of the over. Drinks are on the field.'] },
  ],
  rugby: [
    { eventType: 'kickoff',    templates: ['Kick off! {home} get us started.'] },
    { eventType: 'goal',       actor: true, team: true, templates: [
      'TRY! {actor} crashes over the line for {team}!',
      'TRY! {actor} dives over in the corner for {team}! Magnificent score!',
    ]},
    { eventType: 'yellow_card', actor: true, templates: ['{actor} is sin-binned. Ten minutes in the bin.'] },
    { eventType: 'red_card',   actor: true, templates: ['RED CARD! {actor} is dismissed for dangerous play!'] },
    { eventType: 'penalty',    actor: true, team: true, templates: ['{actor} steps up and slots the penalty for {team}.'] },
    { eventType: 'halftime',   templates: ['Half time whistle! Both teams head in.'] },
    { eventType: 'fulltime',   templates: ['Full time! What a game of rugby.'] },
  ],
  baseball: [
    { eventType: 'kickoff',    templates: ['Play ball! {home} take the field.'] },
    { eventType: 'goal',       actor: true, team: true, templates: [
      'HOME RUN! {actor} sends it over the fence for {team}!',
      'RBI single from {actor}! {team} get on the board.',
      'Double play! {team} get out of the inning cleanly.',
    ]},
    { eventType: 'fulltime',   templates: ['Inning over. Three up, three down.', 'End of the inning — scoreboard check time.'] },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3600 * 1000);
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);
}

function generateCommentaryForMatch(
  matchId: number,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  status: string,
  count: number
) {
  const templates = COMMENTARY[sport] ?? COMMENTARY.football;
  const rows = [];

  // Always start with kickoff
  const kickoff = templates.find(t => t.eventType === 'kickoff');
  if (kickoff) {
    rows.push({
      matchId,
      minute: 1,
      sequence: 0,
      period: sport === 'cricket' ? 'innings_1' : sport === 'tennis' ? 'set_1' : 'first_half',
      eventType: 'kickoff',
      message: fillTemplate(pick(kickoff.templates), { home: homeTeam, away: awayTeam }),
    });
  }

  // Random events
  for (let i = 1; i < count; i++) {
    const tpl = pick(templates.filter(t => t.eventType !== 'kickoff'));
    const team = pick([homeTeam, awayTeam]);

    // Pick actor from a plausible name pool
    const actors: Record<string, string[]> = {
      football: ['Silva', 'Müller', 'Benzema', 'Salah', 'De Bruyne', 'Mbappé', 'Haaland', 'Kane', 'Saka', 'Mané', 'Grealish', 'Mount'],
      tennis: ['the server', 'the returner', 'the baseline player'],
      basketball: ['Johnson', 'Williams', 'Davis', 'Thompson', 'Mitchell', 'Curry', 'James', 'Durant', 'Irving', 'Tatum'],
      cricket: ['Kohli', 'Smith', 'Root', 'Babar', 'de Kock', 'Bumrah', 'Starc', 'Anderson', 'Rabada', 'Rashid'],
      rugby: ['Jones', 'Smith', 'du Preez', 'Itoje', 'Dupont', 'Barrett', 'Kolisi'],
      baseball: ['Rodriguez', 'Johnson', 'Williams', 'Martinez', 'Garcia', 'Ohtani', 'Judge'],
    };

    const actor = pick(actors[sport] ?? actors.football);
    const maxMinute = sport === 'basketball' ? 48 : sport === 'cricket' ? 100 : sport === 'tennis' ? 90 : 90;
    const minute = rand(2, maxMinute);

    const periods: Record<string, string[]> = {
      football: ['first_half', 'first_half', 'first_half', 'second_half', 'second_half', 'second_half', 'extra_time'],
      basketball: ['q1', 'q2', 'q3', 'q4'],
      cricket: ['innings_1', 'innings_1', 'innings_2'],
      tennis: ['set_1', 'set_2', 'set_3'],
      rugby: ['first_half', 'second_half'],
      baseball: ['inning_1', 'inning_2', 'inning_3', 'inning_4', 'inning_5', 'inning_6', 'inning_7', 'inning_8', 'inning_9'],
    };
    const period = pick(periods[sport] ?? periods.football);

    rows.push({
      matchId,
      minute,
      sequence: i,
      period,
      eventType: tpl.eventType,
      actor: tpl.actor ? actor : undefined,
      team: tpl.team ? team : undefined,
      message: fillTemplate(pick(tpl.templates), { actor, team, home: homeTeam, away: awayTeam }),
    });
  }

  // End with fulltime for finished matches
  if (status === 'finished') {
    const ft = templates.find(t => t.eventType === 'fulltime');
    if (ft) {
      rows.push({
        matchId,
        minute: sport === 'basketball' ? 48 : sport === 'cricket' ? 100 : 90,
        sequence: count,
        period: sport === 'basketball' ? 'q4' : sport === 'cricket' ? 'innings_2' : 'second_half',
        eventType: 'fulltime',
        message: pick(ft.templates),
      });
    }
  }

  return rows;
}

function generateMatches(count: number) {
  const sports = Object.keys(TEAMS);
  const result = [];

  for (let i = 0; i < count; i++) {
    const sport = pick(sports);
    const teams = [...TEAMS[sport]];
    const homeIdx = rand(0, teams.length - 1);
    teams.splice(homeIdx, 1);
    const homeTeam = TEAMS[sport][homeIdx];
    const awayTeam = pick(teams);

    // Distribute statuses: 30% live, 30% finished, 40% scheduled
    const roll = Math.random();
    let status: 'live' | 'finished' | 'scheduled';
    let startTime: Date;
    let endTime: Date | undefined;
    let homeScore = 0;
    let awayScore = 0;

    if (roll < 0.3) {
      status = 'live';
      startTime = hoursFromNow(-rand(0, 2));
      homeScore = sport === 'basketball' ? rand(60, 110) : sport === 'cricket' ? rand(80, 300) : rand(0, 4);
      awayScore = sport === 'basketball' ? rand(60, 110) : sport === 'cricket' ? rand(80, 300) : rand(0, 4);
    } else if (roll < 0.6) {
      status = 'finished';
      startTime = hoursFromNow(-rand(3, 48));
      endTime = new Date(startTime.getTime() + rand(90, 120) * 60 * 1000);
      homeScore = sport === 'basketball' ? rand(80, 130) : sport === 'cricket' ? rand(120, 350) : rand(0, 6);
      awayScore = sport === 'basketball' ? rand(80, 130) : sport === 'cricket' ? rand(120, 350) : rand(0, 6);
    } else {
      status = 'scheduled';
      startTime = hoursFromNow(rand(1, 72));
    }

    result.push({ sport, homeTeam, awayTeam, status, startTime, endTime, homeScore, awayScore });
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const MATCH_COUNT = 120;
const COMMENTARY_PER_MATCH = { live: 15, finished: 25, scheduled: 0 };

async function seed() {
  console.log(`\n🌱 Generating ${MATCH_COUNT} matches…\n`);
  const matchData = generateMatches(MATCH_COUNT);

  // Insert in batches of 50
  const allInserted = [];
  for (let i = 0; i < matchData.length; i += 50) {
    const batch = matchData.slice(i, i + 50);
    const inserted = await db.insert(matches).values(batch).returning();
    allInserted.push(...inserted);
  }

  const byStatus = { live: 0, finished: 0, scheduled: 0 };
  allInserted.forEach(m => byStatus[m.status]++);
  console.log(`  ✓ ${allInserted.length} matches inserted`);
  console.log(`     ${byStatus.live} live · ${byStatus.finished} finished · ${byStatus.scheduled} scheduled\n`);

  // Generate commentary
  const allCommentary = allInserted.flatMap(m => {
    const count = COMMENTARY_PER_MATCH[m.status] ?? 0;
    if (count === 0) return [];
    return generateCommentaryForMatch(m.id, m.sport, m.homeTeam, m.awayTeam, m.status, count);
  });

  // Insert commentary in batches of 100
  for (let i = 0; i < allCommentary.length; i += 100) {
    await db.insert(commentary).values(allCommentary.slice(i, i + 100));
  }

  console.log(`  ✓ ${allCommentary.length} commentary entries inserted\n`);
  console.log('✅ Seed complete!\n');

  await pool.end();
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
