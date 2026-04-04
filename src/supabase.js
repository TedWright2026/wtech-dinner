import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const GUESTS = [
  { name: 'Alister Wilson', company: 'API' },
  { name: 'Andy', company: 'API' },
  { name: 'Frederick Leggett', company: 'API' },
  { name: 'Rahib', company: 'API' },
  { name: 'Russ Becker', company: 'API' },
  { name: 'Ayliin Zubicueta', company: 'CE Sprinkler' },
  { name: 'Jim Nilsson', company: 'CE Sprinkler' },
  { name: 'Carl Turner', company: 'Compco' },
  { name: 'Matt Baker', company: 'Compco' },
  { name: 'Michael Rühl', company: 'FeuerFuchs' },
  { name: 'Wolfgang Knipping', company: 'FeuerFuchs' },
  { name: 'Lea Rautio', company: 'Firecon' },
  { name: 'Timo Suuronen', company: 'Firecon' },
  { name: 'Gary Callaghan', company: 'Ideal Fire' },
  { name: 'Lisa Walsh', company: 'Ideal Fire' },
  { name: 'Luis Rodriguez', company: 'Pacisa' },
  { name: 'Mario Rodriguez', company: 'Pacisa' },
  { name: 'Raul Rodriguez del Álamo', company: 'Pacisa' },
  { name: 'Evan O Connell', company: 'Safety Tech' },
  { name: 'Patrick O Donovan', company: 'Safety Tech' },
  { name: 'Niall Reilly', company: 'SRS Alert' },
  { name: 'Ronan Behan', company: 'SRS Alert' },
  { name: 'Sean Kenny', company: 'SRS Alert' },
  { name: 'Stephen Barry', company: 'SRS Alert' },
  { name: 'Michael Rees', company: 'Wilec' },
  { name: 'Michelle Byrne', company: 'Wilec' },
  { name: 'Danylo Razlovan', company: 'WTech' },
  { name: 'Darren Roche', company: 'WTech' },
  { name: 'Donal Mac Nioclais', company: 'WTech' },
  { name: 'Eamon Kilheaney', company: 'WTech' },
  { name: 'Grainne Moffit', company: 'WTech' },
  { name: 'Karen Duffy', company: 'WTech' },
  { name: 'Luis Fellipy Bett', company: 'WTech' },
  { name: 'Mark Flanagan', company: 'WTech' },
  { name: 'Paul Carroll', company: 'WTech' },
  { name: 'Sandra Lynam', company: 'WTech' },
  { name: 'Ted Wright', company: 'WTech' },
  { name: 'Deirdre Dardis', company: 'Writech' },
  { name: 'Eddie Pearson', company: 'Writech' },
  { name: 'Matt Parker', company: 'Writech' },
]

export const MENU = {
  starters: ['Crab Tacos', 'Mix Fried', 'Gamberi'],
  mains: ['Sea Bass', 'Fillet Steak', 'Ragu Pasta'],
  desserts: ['Tiramisu', 'Ice Cream'],
  wines: ['Red Wine', 'White Wine', 'No Wine'],
}
