/**
 * Previous Season Squad Data
 * Mock data representing last season's squads for each IPL team
 * Used for player retention in Mega Auction setup
 */

import { Player, PlayerRole } from './types';

/**
 * Generate a player ID from name
 */
function generatePlayerId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Create a player object for previous season squad
 */
function createPlayer(
  name: string,
  role: PlayerRole,
  isCapped: boolean,
  rating: number = 70,
  popularity: number = 50
): Player {
  const id = generatePlayerId(name);
  // For previous season players, use default pricing
  // These will be used only for retention, not auction
  const basePrice = isCapped ? 2 : 1;
  const minPrice = rating * 0.1; // Rough estimate
  const maxPrice = rating * 0.25; // Rough estimate

  return {
    id,
    name,
    role,
    basePrice,
    minPrice,
    maxPrice,
    rating,
    popularity,
    isCapped,
  };
}

/**
 * Previous season squads for all IPL teams
 * Mapping: teamId → Player[]
 */
export const previousSeasonSquads: Record<string, Player[]> = {
  // Mumbai Indians
  mi: [
    createPlayer('Rohit Sharma', PlayerRole.BATSMAN, true, 88, 95),
    createPlayer('Jasprit Bumrah', PlayerRole.BOWLER, true, 92, 90),
    createPlayer('Suryakumar Yadav', PlayerRole.BATSMAN, true, 85, 85),
    createPlayer('Hardik Pandya', PlayerRole.ALL_ROUNDER, true, 87, 88),
    createPlayer('Ishan Kishan', PlayerRole.WICKET_KEEPER_BATSMAN, true, 82, 80),
    createPlayer('Tilak Varma', PlayerRole.BATSMAN, false, 75, 70),
    createPlayer('Tim David', PlayerRole.BATSMAN, true, 80, 75),
    createPlayer('Cameron Green', PlayerRole.ALL_ROUNDER, true, 84, 78),
    createPlayer('Jofra Archer', PlayerRole.BOWLER, true, 89, 85),
    createPlayer('Piyush Chawla', PlayerRole.BOWLER, true, 72, 65),
    createPlayer('Nehal Wadhera', PlayerRole.BATSMAN, false, 68, 55),
    createPlayer('Akash Madhwal', PlayerRole.BOWLER, false, 70, 60),
    createPlayer('Kumar Kartikeya', PlayerRole.BOWLER, false, 69, 58),
    createPlayer('Hrithik Shokeen', PlayerRole.ALL_ROUNDER, false, 65, 50),
    createPlayer('Ramandeep Singh', PlayerRole.ALL_ROUNDER, false, 67, 52),
    createPlayer('Shams Mulani', PlayerRole.BOWLER, false, 66, 48),
    createPlayer('Vishnu Vinod', PlayerRole.WICKET_KEEPER, false, 64, 45),
  ],

  // Chennai Super Kings
  csk: [
    createPlayer('MS Dhoni', PlayerRole.WICKET_KEEPER_BATSMAN, true, 85, 98),
    createPlayer('Ruturaj Gaikwad', PlayerRole.BATSMAN, true, 83, 82),
    createPlayer('Devon Conway', PlayerRole.BATSMAN, true, 86, 80),
    createPlayer('Ravindra Jadeja', PlayerRole.ALL_ROUNDER, true, 88, 90),
    createPlayer('Shivam Dube', PlayerRole.ALL_ROUNDER, true, 78, 72),
    createPlayer('Moeen Ali', PlayerRole.ALL_ROUNDER, true, 81, 75),
    createPlayer('Deepak Chahar', PlayerRole.BOWLER, true, 84, 78),
    createPlayer('Matheesha Pathirana', PlayerRole.BOWLER, true, 79, 70),
    createPlayer('Tushar Deshpande', PlayerRole.BOWLER, false, 72, 65),
    createPlayer('Maheesh Theekshana', PlayerRole.BOWLER, true, 77, 68),
    createPlayer('Ajinkya Rahane', PlayerRole.BATSMAN, true, 80, 85),
    createPlayer('Ambati Rayudu', PlayerRole.BATSMAN, true, 76, 70),
    createPlayer('Mitchell Santner', PlayerRole.ALL_ROUNDER, true, 78, 72),
    createPlayer('Subhranshu Senapati', PlayerRole.BATSMAN, false, 68, 55),
    createPlayer('Rajvardhan Hangargekar', PlayerRole.ALL_ROUNDER, false, 70, 60),
    createPlayer('Simarjeet Singh', PlayerRole.BOWLER, false, 69, 58),
    createPlayer('Prashant Solanki', PlayerRole.BOWLER, false, 67, 52),
  ],

  // Royal Challengers Bangalore
  rcb: [
    createPlayer('Virat Kohli', PlayerRole.BATSMAN, true, 90, 98),
    createPlayer('Faf du Plessis', PlayerRole.BATSMAN, true, 87, 88),
    createPlayer('Glenn Maxwell', PlayerRole.ALL_ROUNDER, true, 86, 85),
    createPlayer('Mohammed Siraj', PlayerRole.BOWLER, true, 85, 82),
    createPlayer('Dinesh Karthik', PlayerRole.WICKET_KEEPER_BATSMAN, true, 78, 80),
    createPlayer('Harshal Patel', PlayerRole.BOWLER, true, 82, 78),
    createPlayer('Wanindu Hasaranga', PlayerRole.ALL_ROUNDER, true, 84, 80),
    createPlayer('Josh Hazlewood', PlayerRole.BOWLER, true, 88, 85),
    createPlayer('Mahipal Lomror', PlayerRole.BATSMAN, false, 73, 65),
    createPlayer('Anuj Rawat', PlayerRole.WICKET_KEEPER_BATSMAN, false, 70, 62),
    createPlayer('Shahbaz Ahmed', PlayerRole.ALL_ROUNDER, false, 74, 68),
    createPlayer('Karn Sharma', PlayerRole.BOWLER, true, 71, 60),
    createPlayer('Suyash Prabhudessai', PlayerRole.BATSMAN, false, 69, 58),
    createPlayer('David Willey', PlayerRole.ALL_ROUNDER, true, 79, 72),
    createPlayer('Siddarth Kaul', PlayerRole.BOWLER, true, 72, 65),
    createPlayer('Akash Deep', PlayerRole.BOWLER, false, 71, 60),
    createPlayer('Rajan Kumar', PlayerRole.BOWLER, false, 68, 55),
  ],

  // Kolkata Knight Riders
  kkr: [
    createPlayer('Shreyas Iyer', PlayerRole.BATSMAN, true, 85, 85),
    createPlayer('Andre Russell', PlayerRole.ALL_ROUNDER, true, 89, 90),
    createPlayer('Sunil Narine', PlayerRole.ALL_ROUNDER, true, 83, 88),
    createPlayer('Varun Chakaravarthy', PlayerRole.BOWLER, true, 81, 75),
    createPlayer('Venkatesh Iyer', PlayerRole.ALL_ROUNDER, true, 79, 78),
    createPlayer('Nitish Rana', PlayerRole.BATSMAN, true, 77, 72),
    createPlayer('Rinku Singh', PlayerRole.BATSMAN, false, 76, 80),
    createPlayer('Shardul Thakur', PlayerRole.ALL_ROUNDER, true, 80, 78),
    createPlayer('Umesh Yadav', PlayerRole.BOWLER, true, 78, 75),
    createPlayer('Lockie Ferguson', PlayerRole.BOWLER, true, 82, 78),
    createPlayer('Rahmanullah Gurbaz', PlayerRole.WICKET_KEEPER_BATSMAN, true, 75, 70),
    createPlayer('Anukul Roy', PlayerRole.ALL_ROUNDER, false, 70, 62),
    createPlayer('Harshit Rana', PlayerRole.BOWLER, false, 72, 65),
    createPlayer('Vaibhav Arora', PlayerRole.BOWLER, false, 71, 60),
    createPlayer('Suyash Sharma', PlayerRole.BOWLER, false, 69, 58),
    createPlayer('Mandeep Singh', PlayerRole.BATSMAN, true, 73, 68),
    createPlayer('Litton Das', PlayerRole.WICKET_KEEPER_BATSMAN, true, 74, 70),
  ],

  // Delhi Capitals
  dc: [
    createPlayer('Rishabh Pant', PlayerRole.WICKET_KEEPER_BATSMAN, true, 86, 88),
    createPlayer('David Warner', PlayerRole.BATSMAN, true, 85, 90),
    createPlayer('Axar Patel', PlayerRole.ALL_ROUNDER, true, 82, 80),
    createPlayer('Prithvi Shaw', PlayerRole.BATSMAN, true, 79, 82),
    createPlayer('Mitchell Marsh', PlayerRole.ALL_ROUNDER, true, 84, 85),
    createPlayer('Anrich Nortje', PlayerRole.BOWLER, true, 87, 85),
    createPlayer('Kuldeep Yadav', PlayerRole.BOWLER, true, 83, 80),
    createPlayer('Ishant Sharma', PlayerRole.BOWLER, true, 78, 75),
    createPlayer('Khaleel Ahmed', PlayerRole.BOWLER, true, 76, 72),
    createPlayer('Lalit Yadav', PlayerRole.ALL_ROUNDER, false, 72, 65),
    createPlayer('Rovman Powell', PlayerRole.BATSMAN, true, 80, 75),
    createPlayer('Chetan Sakariya', PlayerRole.BOWLER, false, 74, 68),
    createPlayer('Yash Dhull', PlayerRole.BATSMAN, false, 70, 62),
    createPlayer('Ripal Patel', PlayerRole.BATSMAN, false, 71, 60),
    createPlayer('Pravin Dubey', PlayerRole.BOWLER, false, 69, 58),
    createPlayer('Vicky Ostwal', PlayerRole.BOWLER, false, 68, 55),
    createPlayer('Abishek Porel', PlayerRole.WICKET_KEEPER, false, 67, 52),
  ],

  // Sunrisers Hyderabad
  srh: [
    createPlayer('Aiden Markram', PlayerRole.BATSMAN, true, 84, 82),
    createPlayer('Heinrich Klaasen', PlayerRole.WICKET_KEEPER_BATSMAN, true, 83, 80),
    createPlayer('Bhuvneshwar Kumar', PlayerRole.BOWLER, true, 81, 85),
    createPlayer('T Natarajan', PlayerRole.BOWLER, true, 78, 75),
    createPlayer('Abdul Samad', PlayerRole.BATSMAN, false, 74, 70),
    createPlayer('Marco Jansen', PlayerRole.ALL_ROUNDER, true, 79, 72),
    createPlayer('Abhishek Sharma', PlayerRole.ALL_ROUNDER, false, 76, 78),
    createPlayer('Rahul Tripathi', PlayerRole.BATSMAN, true, 80, 78),
    createPlayer('Washington Sundar', PlayerRole.ALL_ROUNDER, true, 77, 75),
    createPlayer('Mayank Markande', PlayerRole.BOWLER, false, 73, 68),
    createPlayer('Umran Malik', PlayerRole.BOWLER, true, 82, 85),
    createPlayer('Glenn Phillips', PlayerRole.BATSMAN, true, 78, 72),
    createPlayer('Fazalhaq Farooqi', PlayerRole.BOWLER, true, 75, 68),
    createPlayer('Vivrant Sharma', PlayerRole.BATSMAN, false, 70, 62),
    createPlayer('Sanvir Singh', PlayerRole.ALL_ROUNDER, false, 69, 58),
    createPlayer('Mayank Dagar', PlayerRole.BOWLER, false, 71, 60),
    createPlayer('Nitish Kumar Reddy', PlayerRole.ALL_ROUNDER, false, 68, 55),
  ],

  // Rajasthan Royals
  rr: [
    createPlayer('Sanju Samson', PlayerRole.WICKET_KEEPER_BATSMAN, true, 85, 88),
    createPlayer('Jos Buttler', PlayerRole.WICKET_KEEPER_BATSMAN, true, 91, 95),
    createPlayer('Yashasvi Jaiswal', PlayerRole.BATSMAN, true, 84, 85),
    createPlayer('Ravichandran Ashwin', PlayerRole.ALL_ROUNDER, true, 82, 88),
    createPlayer('Yuzvendra Chahal', PlayerRole.BOWLER, true, 86, 90),
    createPlayer('Trent Boult', PlayerRole.BOWLER, true, 88, 88),
    createPlayer('Shimron Hetmyer', PlayerRole.BATSMAN, true, 81, 78),
    createPlayer('Devdutt Padikkal', PlayerRole.BATSMAN, true, 78, 80),
    createPlayer('Prasidh Krishna', PlayerRole.BOWLER, true, 80, 75),
    createPlayer('Riyan Parag', PlayerRole.ALL_ROUNDER, false, 75, 72),
    createPlayer('Navdeep Saini', PlayerRole.BOWLER, true, 76, 72),
    createPlayer('KC Cariappa', PlayerRole.BOWLER, false, 70, 62),
    createPlayer('Kuldeep Sen', PlayerRole.BOWLER, false, 73, 68),
    createPlayer('Dhruv Jurel', PlayerRole.WICKET_KEEPER_BATSMAN, false, 72, 70),
    createPlayer('Kunal Singh Rathore', PlayerRole.BATSMAN, false, 68, 55),
    createPlayer('Donovan Ferreira', PlayerRole.WICKET_KEEPER_BATSMAN, true, 74, 68),
    createPlayer('Adam Zampa', PlayerRole.BOWLER, true, 79, 75),
  ],

  // Punjab Kings
  pbks: [
    createPlayer('Shikhar Dhawan', PlayerRole.BATSMAN, true, 84, 90),
    createPlayer('Kagiso Rabada', PlayerRole.BOWLER, true, 87, 88),
    createPlayer('Arshdeep Singh', PlayerRole.BOWLER, true, 82, 85),
    createPlayer('Liam Livingstone', PlayerRole.ALL_ROUNDER, true, 83, 82),
    createPlayer('Sam Curran', PlayerRole.ALL_ROUNDER, true, 85, 85),
    createPlayer('Harpreet Brar', PlayerRole.BOWLER, false, 74, 70),
    createPlayer('Rahul Chahar', PlayerRole.BOWLER, true, 78, 75),
    createPlayer('Jitesh Sharma', PlayerRole.WICKET_KEEPER_BATSMAN, false, 76, 78),
    createPlayer('Prabhsimran Singh', PlayerRole.WICKET_KEEPER_BATSMAN, false, 73, 72),
    createPlayer('Nathan Ellis', PlayerRole.BOWLER, true, 79, 72),
    createPlayer('Rishi Dhawan', PlayerRole.ALL_ROUNDER, true, 72, 68),
    createPlayer('Shahrukh Khan', PlayerRole.BATSMAN, false, 75, 80),
    createPlayer('Sikandar Raza', PlayerRole.ALL_ROUNDER, true, 77, 75),
    createPlayer('Harpreet Bhatia', PlayerRole.BATSMAN, false, 71, 65),
    createPlayer('Vidwath Kaverappa', PlayerRole.BOWLER, false, 70, 62),
    createPlayer('Mohit Rathee', PlayerRole.BOWLER, false, 69, 58),
    createPlayer('Atharva Taide', PlayerRole.BATSMAN, false, 68, 55),
  ],

  // Gujarat Titans
  gt: [
    createPlayer('Hardik Pandya', PlayerRole.ALL_ROUNDER, true, 87, 90),
    createPlayer('Shubman Gill', PlayerRole.BATSMAN, true, 88, 92),
    createPlayer('Rashid Khan', PlayerRole.BOWLER, true, 90, 95),
    createPlayer('Mohammed Shami', PlayerRole.BOWLER, true, 86, 88),
    createPlayer('David Miller', PlayerRole.BATSMAN, true, 83, 85),
    createPlayer('Wriddhiman Saha', PlayerRole.WICKET_KEEPER_BATSMAN, true, 78, 80),
    createPlayer('Rahul Tewatia', PlayerRole.ALL_ROUNDER, false, 77, 82),
    createPlayer('Alzarri Joseph', PlayerRole.BOWLER, true, 81, 78),
    createPlayer('Yash Dayal', PlayerRole.BOWLER, false, 75, 70),
    createPlayer('Sai Sudharsan', PlayerRole.BATSMAN, false, 76, 75),
    createPlayer('Vijay Shankar', PlayerRole.ALL_ROUNDER, true, 74, 72),
    createPlayer('Jayant Yadav', PlayerRole.BOWLER, true, 72, 68),
    createPlayer('Darshan Nalkande', PlayerRole.BOWLER, false, 71, 65),
    createPlayer('R Sai Kishore', PlayerRole.BOWLER, false, 73, 70),
    createPlayer('Abhinav Manohar', PlayerRole.BATSMAN, false, 72, 68),
    createPlayer('Pradeep Sangwan', PlayerRole.BOWLER, true, 70, 65),
    createPlayer('Matthew Wade', PlayerRole.WICKET_KEEPER_BATSMAN, true, 79, 78),
  ],

  // Lucknow Super Giants
  lsg: [
    createPlayer('KL Rahul', PlayerRole.WICKET_KEEPER_BATSMAN, true, 87, 92),
    createPlayer('Quinton de Kock', PlayerRole.WICKET_KEEPER_BATSMAN, true, 85, 88),
    createPlayer('Marcus Stoinis', PlayerRole.ALL_ROUNDER, true, 84, 85),
    createPlayer('Ravi Bishnoi', PlayerRole.BOWLER, true, 82, 85),
    createPlayer('Nicholas Pooran', PlayerRole.WICKET_KEEPER_BATSMAN, true, 83, 82),
    createPlayer('Avesh Khan', PlayerRole.BOWLER, true, 79, 78),
    createPlayer('Krunal Pandya', PlayerRole.ALL_ROUNDER, true, 78, 80),
    createPlayer('Mark Wood', PlayerRole.BOWLER, true, 86, 85),
    createPlayer('Ayush Badoni', PlayerRole.BATSMAN, false, 74, 75),
    createPlayer('Kyle Mayers', PlayerRole.ALL_ROUNDER, true, 80, 78),
    createPlayer('Deepak Hooda', PlayerRole.ALL_ROUNDER, true, 77, 75),
    createPlayer('Mohsin Khan', PlayerRole.BOWLER, false, 76, 78),
    createPlayer('Naveen-ul-Haq', PlayerRole.BOWLER, true, 75, 72),
    createPlayer('Yudhvir Singh', PlayerRole.ALL_ROUNDER, false, 71, 65),
    createPlayer('Karan Sharma', PlayerRole.BOWLER, false, 70, 62),
    createPlayer('Amit Mishra', PlayerRole.BOWLER, true, 73, 70),
    createPlayer('Prerak Mankad', PlayerRole.ALL_ROUNDER, false, 72, 68),
  ],
};

/**
 * Get previous season squad for a team
 */
export function getPreviousSeasonSquad(teamId: string): Player[] {
  return previousSeasonSquads[teamId] || [];
}

/**
 * Get all previous season squads
 */
export function getAllPreviousSeasonSquads(): Record<string, Player[]> {
  return previousSeasonSquads;
}

