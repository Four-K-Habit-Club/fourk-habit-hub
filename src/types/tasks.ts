export interface TaskCategory {
  id: string;
  name: string;
  points: number;
  icon: string;
  color: string;
}

export interface SubTask {
  id: string;
  name: string;
  nameEn: string;
  nameSw: string;
  points: number;
}

export interface Task {
  id: string;
  name: string;
  nameEn: string;
  nameSw: string;
  points: number;
  icon: string;
  color: string;
  subtasks: SubTask[];
}

export interface TaskLog {
  date: string;
  taskId: string;
  subtaskId?: string;
  points: number;
  timestamp: number;
}

export interface DailyProgress {
  date: string;
  totalPoints: number;
  logs: TaskLog[];
}

export const TASKS: Task[] = [
  {
    id: 'kuoga',
    name: 'Kuoga',
    nameEn: 'Bathing',
    nameSw: 'Kuoga',
    points: 30,
    icon: 'Bath',
    color: 'primary',
    subtasks: [
      { id: 'prep', name: 'Prep', nameEn: 'Undressing & bed prep', nameSw: 'Kuvua nguo na kutengeneza kitanda', points: 5 },
      { id: 'bathing', name: 'Bathing', nameEn: 'Bathing thoroughly', nameSw: 'Kuoga vizuri', points: 10 },
      { id: 'cleaning', name: 'Cleaning area', nameEn: 'Cleaning bathing area', nameSw: 'Kusafisha mahali pa kuogelea', points: 5 },
      { id: 'grooming', name: 'Grooming', nameEn: 'Lotion, hair, nails, deodorant', nameSw: 'Lotion, nywele, kucha, mafuta ya harufu', points: 5 },
      { id: 'teeth', name: 'Teeth', nameEn: 'Brushing teeth properly', nameSw: 'Kusafisha meno vizuri', points: 5 },
    ],
  },
  {
    id: 'kufua',
    name: 'Kufua',
    nameEn: 'Laundry',
    nameSw: 'Kufua',
    points: 20,
    icon: 'Shirt',
    color: 'secondary',
    subtasks: [
      { id: 'underwear', name: 'Underwear', nameEn: 'Underwear', nameSw: 'Nguo za ndani', points: 5 },
      { id: 'socks', name: 'Socks', nameEn: 'Socks', nameSw: 'Soksi', points: 4 },
      { id: 'tops', name: 'Tops', nameEn: 'T-shirts / Tops', nameSw: 'Mashati / Blauzi', points: 4 },
      { id: 'bottoms', name: 'Bottoms', nameEn: 'Trousers / Skirts', nameSw: 'Suruali / Sketi', points: 3 },
      { id: 'outerwear', name: 'Outerwear', nameEn: 'Jackets, sweaters', nameSw: 'Jaketi, sweta', points: 2 },
      { id: 'linens', name: 'Linens', nameEn: 'Bed linens / pillowcases', nameSw: 'Mashuka / Foronya', points: 2 },
    ],
  },
  {
    id: 'kusafisha',
    name: 'Kusafisha',
    nameEn: 'Cleaning',
    nameSw: 'Kusafisha',
    points: 25,
    icon: 'Sparkles',
    color: 'accent',
    subtasks: [
      { id: 'sweeping', name: 'Sweeping', nameEn: 'Sweeping floors', nameSw: 'Kufagia sakafu', points: 5 },
      { id: 'mopping', name: 'Mopping', nameEn: 'Mopping floors', nameSw: 'Kupangusa sakafu', points: 5 },
      { id: 'countertops', name: 'Countertops', nameEn: 'Cleaning countertops/sinks', nameSw: 'Kusafisha countertops/sinki', points: 5 },
      { id: 'dusting', name: 'Dusting', nameEn: 'Dusting furniture/shelves', nameSw: 'Kufuta vumbi vifaa/rafu', points: 3 },
      { id: 'windows', name: 'Windows', nameEn: 'Cleaning windows/mirrors', nameSw: 'Kusafisha madirisha/vioo', points: 2 },
      { id: 'organizing', name: 'Organizing', nameEn: 'Organizing clutter', nameSw: 'Kupanga vitu', points: 3 },
      { id: 'trash', name: 'Trash', nameEn: 'Taking out trash', nameSw: 'Kutoa takataka', points: 2 },
    ],
  },
  {
    id: 'kupika',
    name: 'Kupika',
    nameEn: 'Cooking',
    nameSw: 'Kupika',
    points: 25,
    icon: 'ChefHat',
    color: 'secondary',
    subtasks: [
      { id: 'planning', name: 'Planning', nameEn: 'Planning the meal', nameSw: 'Kupanga chakula', points: 3 },
      { id: 'cooking', name: 'Cooking', nameEn: 'Cooking main dish', nameSw: 'Kupika chakula kikuu', points: 7 },
      { id: 'sink', name: 'Sink/Counter', nameEn: 'Sink / Countertop cleaning', nameSw: 'Kusafisha sinki / countertop', points: 5 },
      { id: 'plates', name: 'Plates/Cups', nameEn: 'Washing plates/cups', nameSw: 'Kuosha sahani/vikombe', points: 3 },
      { id: 'sufuria', name: 'Sufuria', nameEn: 'Washing sufuria (cooking pot)', nameSw: 'Kuosha sufuria', points: 7 },
    ],
  },
];
