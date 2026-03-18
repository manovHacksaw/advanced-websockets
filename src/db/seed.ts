import 'dotenv/config';
import { db, pool } from './db';
import { matches, commentary } from './schema';

// ─── Teams & Players ──────────────────────────────────────────────────────────

const SPORT_DATA: Record<string, {
  teams: string[];
  players: string[];
}> = {
  football: {
    teams: [
      'Arsenal', 'Chelsea', 'Manchester City', 'Liverpool', 'Manchester United',
      'Tottenham Hotspur', 'Newcastle United', 'Aston Villa', 'West Ham United', 'Brighton',
      'Real Madrid', 'FC Barcelona', 'Atletico Madrid', 'Sevilla FC', 'Valencia CF',
      'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt',
      'Paris Saint-Germain', 'Olympique Marseille', 'Olympique Lyon', 'AS Monaco', 'OGC Nice',
      'Juventus', 'Inter Milan', 'AC Milan', 'SSC Napoli', 'AS Roma',
      'Ajax', 'Feyenoord', 'PSV Eindhoven', 'SL Benfica', 'FC Porto',
      'Celtic FC', 'Rangers FC', 'Galatasaray', 'Fenerbahce', 'Besiktas',
      'Club Brugge', 'Anderlecht', 'Red Star Belgrade', 'Shakhtar Donetsk', 'Dinamo Zagreb',
    ],
    players: [
      'Bukayo Saka', 'Erling Haaland', 'Mohamed Salah', 'Kevin De Bruyne', 'Kylian Mbappé',
      'Vinicius Jr', 'Jude Bellingham', 'Phil Foden', 'Rodri', 'Toni Kroos',
      'Robert Lewandowski', 'Harry Kane', 'Lautaro Martinez', 'Romelu Lukaku', 'Antoine Griezmann',
      'Bernardo Silva', 'Bruno Fernandes', 'Marcus Rashford', 'Son Heung-min', 'Sadio Mané',
      'Leandro Trossard', 'Martin Ødegaard', 'Declan Rice', 'Gabriel Magalhães', 'William Saliba',
      'Vinícius Júnior', 'Pedri', 'Gavi', 'Ousmane Dembélé', 'Raphinha',
      'Federico Valverde', 'Eduardo Camavinga', 'Aurélien Tchouaméni', 'Éder Militão', 'Dani Carvajal',
      'Jamal Musiala', 'Florian Wirtz', 'Granit Xhaka', 'Granit Xhaka', 'Joshua Kimmich',
      'Thomas Müller', 'Leon Goretzka', 'Kingsley Coman', 'Serge Gnabry', 'Leroy Sané',
    ],
  },
  tennis: {
    teams: [
      'Novak Djokovic', 'Carlos Alcaraz', 'Jannik Sinner', 'Daniil Medvedev',
      'Alexander Zverev', 'Andrey Rublev', 'Casper Ruud', 'Stefanos Tsitsipas',
      'Taylor Fritz', 'Holger Rune', 'Ben Shelton', 'Frances Tiafoe',
      'Sebastian Korda', 'Tommy Paul', 'Felix Auger-Aliassime', 'Hubert Hurkacz',
      'Grigor Dimitrov', 'Karen Khachanov', 'Nicolas Jarry', 'Alejandro Davidovich Fokina',
      'Iga Swiatek', 'Aryna Sabalenka', 'Coco Gauff', 'Elena Rybakina',
      'Jessica Pegula', 'Madison Keys', 'Barbora Krejcikova', 'Qinwen Zheng',
      'Mirra Andreeva', 'Emma Navarro', 'Jasmine Paolini', 'Liudmila Samsonova',
    ],
    players: [
      'Novak Djokovic', 'Carlos Alcaraz', 'Jannik Sinner', 'Daniil Medvedev',
      'Alexander Zverev', 'Casper Ruud', 'Stefanos Tsitsipas', 'Taylor Fritz',
      'Iga Swiatek', 'Aryna Sabalenka', 'Coco Gauff', 'Elena Rybakina',
    ],
  },
  basketball: {
    teams: [
      'LA Lakers', 'Golden State Warriors', 'Boston Celtics', 'Miami Heat',
      'Milwaukee Bucks', 'Phoenix Suns', 'Denver Nuggets', 'Dallas Mavericks',
      'Brooklyn Nets', 'Philadelphia 76ers', 'Chicago Bulls', 'Toronto Raptors',
      'Atlanta Hawks', 'Cleveland Cavaliers', 'New York Knicks', 'Orlando Magic',
      'Memphis Grizzlies', 'New Orleans Pelicans', 'Oklahoma City Thunder', 'Sacramento Kings',
      'Minnesota Timberwolves', 'Indiana Pacers', 'Detroit Pistons', 'Washington Wizards',
    ],
    players: [
      'LeBron James', 'Stephen Curry', 'Kevin Durant', 'Giannis Antetokounmpo', 'Luka Dončić',
      'Jayson Tatum', 'Joel Embiid', 'Nikola Jokić', 'Damian Lillard', 'Jimmy Butler',
      'Devin Booker', 'Jaylen Brown', 'Donovan Mitchell', 'Trae Young', 'Zion Williamson',
      'Anthony Davis', 'Bam Adebayo', 'Ja Morant', 'SGA Gilgeous-Alexander', 'De\'Aaron Fox',
      'Karl-Anthony Towns', 'Tyrese Haliburton', 'Paolo Banchero', 'Victor Wembanyama',
    ],
  },
  cricket: {
    teams: [
      'India', 'Australia', 'England', 'Pakistan', 'South Africa',
      'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan',
      'Zimbabwe', 'Ireland', 'Scotland', 'Netherlands', 'UAE',
      'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
      'Kolkata Knight Riders', 'Delhi Capitals', 'Sunrisers Hyderabad',
      'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans',
    ],
    players: [
      'Virat Kohli', 'Rohit Sharma', 'Steve Smith', 'Joe Root', 'Babar Azam',
      'Kane Williamson', 'David Warner', 'Ben Stokes', 'Jasprit Bumrah', 'Pat Cummins',
      'Mitchell Starc', 'James Anderson', 'Kagiso Rabada', 'Rashid Khan', 'Shaheen Afridi',
      'Shubman Gill', 'Yashasvi Jaiswal', 'Travis Head', 'Harry Brook', 'Fakhar Zaman',
      'Rishabh Pant', 'Jos Buttler', 'Quinton de Kock', 'Nicholas Pooran', 'Suryakumar Yadav',
    ],
  },
  rugby: {
    teams: [
      'New Zealand All Blacks', 'South Africa Springboks', 'England', 'Ireland',
      'France', 'Australia Wallabies', 'Wales', 'Scotland',
      'Argentina Los Pumas', 'Fiji', 'Samoa', 'Japan Brave Blossoms',
      'Leinster', 'Munster', 'Ulster', 'Connacht',
      'Toulouse', 'La Rochelle', 'Bordeaux-Bègleset', 'Clermont',
    ],
    players: [
      'Antoine Dupont', 'Richie Mo\'unga', 'Beauden Barrett', 'Handré Pollard', 'Maro Itoje',
      'Tadhg Furlong', 'Ardie Savea', 'Sam Cane', 'Cheslin Kolbe', 'Damian de Allende',
      'Marcus Smith', 'Jonny May', 'Courtney Lawes', 'Tom Curry', 'Ellis Genge',
    ],
  },
  baseball: {
    teams: [
      'New York Yankees', 'LA Dodgers', 'Boston Red Sox', 'Chicago Cubs',
      'Houston Astros', 'Atlanta Braves', 'San Francisco Giants', 'St. Louis Cardinals',
      'Toronto Blue Jays', 'Seattle Mariners', 'Tampa Bay Rays', 'San Diego Padres',
      'New York Mets', 'Philadelphia Phillies', 'Milwaukee Brewers', 'Minnesota Twins',
      'Baltimore Orioles', 'Pittsburgh Pirates', 'Cincinnati Reds', 'Detroit Tigers',
    ],
    players: [
      'Shohei Ohtani', 'Aaron Judge', 'Mookie Betts', 'Freddie Freeman', 'Ronald Acuña Jr',
      'Vladimir Guerrero Jr', 'Bo Bichette', 'Julio Rodríguez', 'Kyle Tucker', 'Yordan Alvarez',
      'Juan Soto', 'Trea Turner', 'Nolan Arenado', 'Paul Goldschmidt', 'Pete Alonso',
    ],
  },
};

// ─── Commentary templates ──────────────────────────────────────────────────────

const TEMPLATES: Record<string, Record<string, string[]>> = {
  football: {
    kickoff: [
      'The referee blows the whistle and {home} get us underway at a packed stadium!',
      '{away} kick off — this highly anticipated clash is finally underway!',
      'We are off and running! The atmosphere here is absolutely electric.',
      'Kick off! Both sides have been waiting for this moment all week.',
      'The match is under way — {home} pressing high from the first whistle.',
    ],
    goal: [
      'GOAL! {actor} finds the net with a stunning finish! {team} take the lead!',
      'GOAL! What a strike from {actor}! The goalkeeper had absolutely no chance!',
      'GOAL! {actor} is clinical! {team} are ahead and the place goes wild!',
      '{actor} SCORES! A brilliant individual effort puts {team} in front!',
      'GOLAZO! {actor} with an unstoppable effort from outside the box for {team}!',
      'GOAL! {actor} taps in from close range — {team} are in dreamland!',
      'GOAL! {actor} heads it home from the corner! {team} edge ahead!',
      'GOAL! A cool, composed finish from {actor}. {team} look dangerous today.',
      "GOAL! {actor} cuts inside and curls it into the far corner. Goalkeeper didn't move!",
      'GOAL! {actor} reacts quickest to the rebound and buries it! {team} ahead!',
    ],
    yellow_card: [
      'Yellow card for {actor} after a reckless lunge. They will need to be careful.',
      '{actor} is booked. The referee had no hesitation whatsoever.',
      'Caution shown to {actor} of {team}. Another one and they are off.',
      'The referee reaches for the yellow card — {actor} picks up a booking.',
      '{actor} looks furious with the decision but the yellow card stands.',
    ],
    red_card: [
      'RED CARD! {actor} is sent off! A dreadful challenge — {team} are down to ten men!',
      'OFF HE GOES! {actor} receives a straight red for a two-footed lunge. Terrible decision.',
      'RED CARD! {actor} lunges in dangerously and the referee does not hesitate.',
      "He's gone! {actor} can have no complaints — that was dangerous play.",
      'RED CARD! {team} in big trouble now. {actor} walks after a moment of madness.',
    ],
    substitution: [
      'Substitution: {actor} is introduced by {team}. Tactical change from the manager.',
      '{team} make a change — {actor} comes on to freshen things up.',
      'Fresh legs for {team} as {actor} enters the pitch.',
      '{actor} is on. {team} looking to change the dynamics of this match.',
      'The board is up — {actor} replaces the starter for {team}.',
    ],
    var: [
      'The referee is consulting the VAR monitor. The crowd anxiously waits.',
      'VAR check underway. The stadium has gone quiet as we wait for the decision.',
      'Video review in progress — the goal is being checked for offside.',
      'Play is stopped as VAR reviews a potential handball in the build-up.',
      "The VAR is checking — this could be crucial to the game's outcome.",
    ],
    penalty: [
      'PENALTY! {actor} steps up for {team} — this is a massive moment.',
      'Spot kick awarded! {actor} places the ball on the spot for {team}.',
      'PENALTY! The referee points to the spot. {actor} will take responsibility.',
    ],
    halftime: [
      'The referee brings the first half to a close. What a 45 minutes of action!',
      'Half time! Both teams head to the dressing room with plenty to think about.',
      'Half-time whistle! An enthralling first half draws to a close.',
      "That's half time. The manager will have strong words to say in the break.",
    ],
    fulltime: [
      'FULL TIME! What a match that was — the crowd are on their feet!',
      'The final whistle blows. An absolutely extraordinary game of football.',
      'Full time. Both sets of fans applaud their sides off the pitch.',
      'That is that! Full time here — a result that will be talked about for days.',
    ],
    foul: [
      'Foul! {actor} brings down his man and the referee immediately blows his whistle.',
      'Free kick awarded against {actor}. Poor challenge in a dangerous area.',
      '{actor} clips the heels of the attacker. The referee is not happy.',
    ],
    injury: [
      '{actor} is down on the turf holding their leg. Physio runs on.',
      'Concern for {actor} — they took a heavy knock and look to be in pain.',
      'Play is stopped as {actor} receives treatment on the pitch.',
    ],
    offside: [
      'Offside! The flag goes up — no goal.',
      'Ruled out for offside after the VAR check. Wafer-thin margins.',
      'The assistant referee had their flag up immediately. Offside called.',
    ],
  },
  tennis: {
    kickoff: [
      '{home} wins the toss and elects to serve first. Here we go!',
      'The umpire calls play — {away} to serve first in this highly anticipated clash.',
      'Players take their positions. The crowd settles in for what promises to be a classic.',
    ],
    ace: [
      'ACE! {actor} fires down an unreturnable serve — no chance for the returner!',
      'ACE! {actor} clocks the serve at over 200km/h — absolutely stunning.',
      'ACE! Right down the T — {actor} wins the point without breaking a sweat.',
      '{actor} with yet another ace! The serve today has been a weapon all match.',
      'ACE! {actor} goes out wide and the returner is completely wrong-footed.',
    ],
    double_fault: [
      'Double fault from {actor}. A gift of a point to the opponent.',
      '{actor} sends the second serve long — double fault. Frustrating moment.',
      'Double fault! {actor} slams their racket in frustration after the error.',
    ],
    break_point: [
      'BREAK! {actor} converts the break point with a stunning cross-court winner!',
      'Break of serve! {actor} takes full advantage with brilliant returning.',
      "BREAK! {actor} is absolutely clinical — this is a crucial moment in the match!",
      '{actor} breaks serve! The crowd erupts at this pivotal swing in momentum.',
    ],
    fulltime: [
      'Set over! {actor} takes it with some brilliant tennis.',
      'Set completed — a fascinating battle of wills throughout.',
      'That set belongs to {actor} after an incredible display.',
    ],
  },
  basketball: {
    kickoff: [
      'Tip-off! We are underway — both teams ready for battle.',
      'The ball is in the air and the game is on! Huge crowd here tonight.',
      'Jump ball! {home} get the tip and we are off and running.',
    ],
    goal: [
      'THREE POINTER! {actor} from way downtown — {team} extend their lead!',
      '{actor} drives baseline and lays it in off the glass for {team}!',
      'AND ONE! {actor} draws the foul and completes the play for {team}!',
      'SLAM DUNK! {actor} throws it down with authority — {team} are on fire!',
      '{actor} with the mid-range pull-up — cold-blooded from {team}!',
      'ALLEY-OOP! {actor} rises and finishes above the rim for {team}!',
      '{actor} hits the step-back three! Unguardable shot for {team}!',
      'Layup from {actor} — {team} working the pick and roll to perfection!',
      '{actor} knocks it down from the logo! Unbelievable range for {team}!',
    ],
    foul: [
      'Foul on {actor}. Two free throws coming up.',
      'Personal foul called on {actor} — headed to the line.',
      '{actor} picks up their third foul. Coach may look to bench them.',
    ],
    substitution: [
      '{actor} checks in for {team}. Coach making a strategic move.',
      'Fresh legs — {actor} is into the game for {team}.',
    ],
    fulltime: [
      'Buzzer sounds! End of the quarter — close game here tonight.',
      'Game over! The buzzer brings this incredible contest to an end.',
      "That's the quarter — both coaches will have plenty to work on.",
    ],
  },
  cricket: {
    kickoff: [
      '{home} win the toss and elect to bat first under clear skies.',
      '{away} win the toss and put {home} in to bat. Interesting decision.',
      'The toss has been made. Players take the field — conditions look excellent.',
    ],
    wicket: [
      'WICKET! {actor} bowls the batter with a perfect delivery — {team} celebrate wildly!',
      'WICKET! Caught behind! {actor} gets the breakthrough — {team} right back in this!',
      'OUT! LBW! {actor} gets one to nip back and the umpire raises the finger!',
      'WICKET! Caught at slip! A brilliant take to give {actor} their wicket!',
      'WICKET! {actor} takes a screamer in the deep — what a catch! {team} on top!',
      "OUT! {actor} bowls a magnificent leg cutter — the batter's stumps shattered!",
      'WICKET! Run out! Brilliant fielding — {actor} with a direct hit at the stumps!',
    ],
    boundary: [
      'FOUR! {actor} drives beautifully through the covers — exquisite timing!',
      'FOUR! {actor} pulls hard off the hip — streaks to the boundary!',
      'FOUR! {actor} cuts hard through point — the fielder had no chance!',
      'FOUR! {actor} flicks it off the pads and it races away!',
      'FOUR! Edged through the vacant slip cordon — {actor} gets lucky but takes it!',
    ],
    six: [
      'SIX! {actor} launches it into the stands over long-on! Enormous hit!',
      'SIX! {actor} steps down the track and lofts it over mid-off — stunning!',
      'MAXIMUM! {actor} connects sweetly and it sails into the upper tier!',
      'SIX! {actor} flat-bats it over extra cover — one of the shots of the day!',
      "SIX! That's gone a mile! {actor} with tremendous power over midwicket!",
    ],
    fulltime: [
      'End of the over. The field is set for the next bowler.',
      'Drinks break on the field. Both sides take a moment to regroup.',
      'End of innings! A superb batting performance concluded.',
    ],
  },
  rugby: {
    kickoff: [
      'Kick off! {home} start this fierce encounter with real intent.',
      'We are underway! Both packs setting the tone early.',
      "The referee blows — here we go! Huge crowd for tonight's fixture.",
    ],
    goal: [
      'TRY! {actor} crashes over the line for {team} — the place erupts!',
      'TRY! {actor} dives over in the corner for {team}! Magnificent score!',
      'TRY! {actor} powers through three defenders to touch down for {team}!',
      'TRY! Brilliant team move and {actor} dots it down under the posts for {team}!',
    ],
    penalty: [
      '{actor} steps up and slots the penalty for {team} from 40 metres.',
      'Three points on the board — {actor} is reliable under the posts for {team}.',
    ],
    yellow_card: [
      '{actor} is sin-binned. Ten minutes in the bin after a deliberate infringement.',
      'Yellow card! {actor} is lucky not to see red — {team} down to 14 men.',
    ],
    red_card: [
      'RED CARD! {actor} is dismissed for dangerous play! {team} in crisis!',
      'Off! {actor} receives a straight red — no argument from the player.',
    ],
    halftime: [
      'Half time whistle. Tight game so far — could go either way.',
      "That's half time. Plenty for both coaches to work on during the break.",
    ],
    fulltime: [
      'Final whistle! What a contest — rugby at its finest.',
      'Full time! Both sides gave everything — this is what the sport is about.',
    ],
  },
  baseball: {
    kickoff: [
      'Play ball! {home} take the field — game time!',
      "The umpire calls 'Play' and we are underway here at the stadium.",
    ],
    goal: [
      'HOME RUN! {actor} absolutely crushes it — that ball is still going!',
      'RBI single from {actor}! {team} get on the board with a timely hit.',
      '{actor} with a seeing-eye single through the gap! Runners on the move for {team}!',
      'GRAND SLAM! {actor} with the bases loaded — {team} fans lose their minds!',
      '{actor} sends it the other way — doubles off the wall for {team}!',
    ],
    foul: [
      'Foul ball! {actor} fouls one back — still alive in the at-bat.',
      '{actor} hooks it foul — no good.',
    ],
    fulltime: [
      'Three up, three down. The pitcher is dealing today.',
      'End of the inning. Scoreboard check time.',
      'Change of innings — {team} look to respond with the bat.',
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3600 * 1000);
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate unique matchups within a sport — no team appears twice per batch */
function uniquePairs(teams: string[], count: number): [string, string][] {
  const pairs: [string, string][] = [];
  const shuffled = shuffle(teams);

  for (let i = 0; i + 1 < shuffled.length && pairs.length < count; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  // If we need more pairs, reshuffle and generate again with different combos
  while (pairs.length < count) {
    const extra = shuffle(teams);
    for (let i = 0; i + 1 < extra.length && pairs.length < count; i += 2) {
      // Ensure this exact pair hasn't been used
      const [a, b] = [extra[i], extra[i + 1]];
      if (!pairs.some(([h, aw]) => (h === a && aw === b) || (h === b && aw === a))) {
        pairs.push([a, b]);
      }
    }
  }
  return pairs.slice(0, count);
}

// ─── Match generator ──────────────────────────────────────────────────────────

function generateMatches(total: number) {
  const sports = Object.keys(SPORT_DATA);
  const perSport = Math.ceil(total / sports.length);
  const result: Array<{
    sport: string; homeTeam: string; awayTeam: string;
    status: 'live' | 'finished' | 'scheduled';
    startTime: Date; endTime?: Date;
    homeScore: number; awayScore: number;
  }> = [];

  for (const sport of sports) {
    const teams = SPORT_DATA[sport].teams;
    const pairs = uniquePairs(teams, perSport);

    for (const [homeTeam, awayTeam] of pairs) {
      // Jitter start time uniquely per match using a random offset in minutes
      const minuteJitter = rand(-90, 90);
      const roll = Math.random();
      let status: 'live' | 'finished' | 'scheduled';
      let startTime: Date;
      let endTime: Date | undefined;
      let homeScore = 0;
      let awayScore = 0;

      if (roll < 0.28) {
        status = 'live';
        startTime = hoursFromNow(-(rand(0, 1) + minuteJitter / 60));
        const isBball = sport === 'basketball';
        const isCricket = sport === 'cricket';
        homeScore = isBball ? rand(50, 110) : isCricket ? rand(60, 320) : rand(0, 5);
        awayScore = isBball ? rand(50, 110) : isCricket ? rand(60, 320) : rand(0, 5);
      } else if (roll < 0.60) {
        status = 'finished';
        startTime = hoursFromNow(-(rand(2, 72) + minuteJitter / 60));
        endTime = new Date(startTime.getTime() + rand(85, 130) * 60 * 1000);
        const isBball = sport === 'basketball';
        const isCricket = sport === 'cricket';
        homeScore = isBball ? rand(85, 135) : isCricket ? rand(120, 380) : rand(0, 7);
        awayScore = isBball ? rand(85, 135) : isCricket ? rand(120, 380) : rand(0, 7);
      } else {
        status = 'scheduled';
        startTime = hoursFromNow(rand(1, 96) + minuteJitter / 60);
      }

      result.push({ sport, homeTeam, awayTeam, status, startTime, endTime, homeScore, awayScore });

      if (result.length >= total) break;
    }

    if (result.length >= total) break;
  }

  return shuffle(result).slice(0, total);
}

// ─── Commentary generator ─────────────────────────────────────────────────────

function generateCommentary(
  matchId: number,
  sport: string,
  homeTeam: string,
  awayTeam: string,
  status: string,
  count: number,
) {
  const tpls = TEMPLATES[sport] ?? TEMPLATES.football;
  const players = shuffle(SPORT_DATA[sport]?.players ?? SPORT_DATA.football.players);
  const allEvents = Object.keys(tpls).filter(e => e !== 'kickoff' && e !== 'fulltime');

  const periods: Record<string, string[]> = {
    football:   ['first_half', 'first_half', 'second_half', 'second_half', 'extra_time'],
    basketball: ['q1', 'q2', 'q3', 'q4'],
    cricket:    ['innings_1', 'innings_1', 'innings_1', 'innings_2', 'innings_2'],
    tennis:     ['set_1', 'set_2', 'set_3'],
    rugby:      ['first_half', 'second_half'],
    baseball:   ['inning_1','inning_2','inning_3','inning_4','inning_5','inning_6','inning_7','inning_8','inning_9'],
  };

  const maxMinute: Record<string, number> = {
    football: 95, basketball: 48, cricket: 100, tennis: 90, rugby: 80, baseball: 54,
  };

  const rows: Array<{
    matchId: number; minute: number; sequence: number; period: string;
    eventType: string; actor?: string; team?: string; message: string;
  }> = [];

  // Kickoff
  const kickoffTpls = tpls.kickoff;
  if (kickoffTpls) {
    rows.push({
      matchId, minute: 1, sequence: 0,
      period: (periods[sport] ?? ['first_half'])[0],
      eventType: 'kickoff',
      message: fillTemplate(pick(kickoffTpls), { home: homeTeam, away: awayTeam }),
    });
  }

  // Spread used templates to avoid repetition within the same match
  const usedTemplates = new Set<string>();

  for (let i = 1; i < count; i++) {
    const eventType = pick(allEvents);
    const eventTpls = tpls[eventType] ?? [];
    if (eventTpls.length === 0) continue;

    // Pick a template not recently used
    let chosenTpl = pick(eventTpls);
    for (let attempt = 0; attempt < 4; attempt++) {
      const candidate = pick(eventTpls);
      if (!usedTemplates.has(candidate)) { chosenTpl = candidate; break; }
    }
    usedTemplates.add(chosenTpl);
    if (usedTemplates.size > 20) usedTemplates.clear(); // Reset to allow reuse

    const actor = players[i % players.length];
    const team = pick([homeTeam, awayTeam]);
    const minute = rand(2, maxMinute[sport] ?? 90);
    const period = pick(periods[sport] ?? ['first_half']);

    rows.push({
      matchId, minute, sequence: i, period, eventType,
      actor: chosenTpl.includes('{actor}') ? actor : undefined,
      team:  chosenTpl.includes('{team}')  ? team  : undefined,
      message: fillTemplate(chosenTpl, { actor, team, home: homeTeam, away: awayTeam }),
    });
  }

  // Fulltime for finished matches
  if (status === 'finished' && tpls.fulltime) {
    rows.push({
      matchId,
      minute: maxMinute[sport] ?? 90,
      sequence: count,
      period: (periods[sport] ?? ['second_half']).at(-1)!,
      eventType: 'fulltime',
      message: fillTemplate(pick(tpls.fulltime), { home: homeTeam, away: awayTeam }),
    });
  }

  return rows;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const MATCH_COUNT = 150;
const COMMENTARY_COUNT: Record<string, number> = { live: 18, finished: 30, scheduled: 0 };

async function seed() {
  const startedAt = Date.now();
  console.log(`\n🌱 Seeding ${MATCH_COUNT} matches with unique pairings…\n`);

  const matchData = generateMatches(MATCH_COUNT);

  const allInserted: typeof matchData[0] & { id: number }[] = [];
  for (let i = 0; i < matchData.length; i += 50) {
    const batch = matchData.slice(i, i + 50);
    const inserted = await db.insert(matches).values(batch).returning();
    allInserted.push(...inserted as any);
  }

  const counts = { live: 0, finished: 0, scheduled: 0 };
  allInserted.forEach(m => counts[m.status]++);

  console.log(`  ✓ ${allInserted.length} matches`);
  console.log(`     🔴 ${counts.live} live  ✅ ${counts.finished} finished  🕐 ${counts.scheduled} scheduled\n`);

  const allCommentary = allInserted.flatMap((m: any) => {
    const n = COMMENTARY_COUNT[m.status] ?? 0;
    if (n === 0) return [];
    return generateCommentary(m.id, m.sport, m.homeTeam, m.awayTeam, m.status, n);
  });

  for (let i = 0; i < allCommentary.length; i += 100) {
    await db.insert(commentary).values(allCommentary.slice(i, i + 100));
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`  ✓ ${allCommentary.length} commentary entries`);
  console.log(`\n✅ Done in ${elapsed}s\n`);

  await pool.end();
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
