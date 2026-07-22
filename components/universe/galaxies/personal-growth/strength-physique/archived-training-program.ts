export type ArchivedTrainingSession = Readonly<{
  exercises: readonly string[];
  id: string;
  name: string;
  rotation: 1 | 2;
}>;

export const archivedTrainingProgram = {
  description:
    "Four-day powerlifting and bodybuilding hypertrophy split, repeated across four weeks with rest taken when needed.",
  originalDocumentPath: "/assets/programs/daniel-powerbuilding-program.pdf",
  progression: [
    "Weeks 1-3 retain the programmed working sets and rep ranges.",
    "Week 4 uses a maximum attempt for Flat Barbell Bench Press and Barbell Squat while the remaining accessory work stays consistent.",
    "Rows shaded grey in the source document are optional when total volume is excessive.",
  ],
  sessions: [
    {
      exercises: [
        "Flat Barbell Bench Press - warm-up, 3 x 5-8 heavy, then 2 x 10-15",
        "Incline Barbell Bench Press - 4 x 8-12",
        "Pec Deck Fly - 4 x 10-15 or failure; final set drop set",
        "Chest Press Machine - 4 x 10-15 or failure; final set drop set",
        "Incline Bench Cable Fly - 4 x 8-12",
        "High-to-Low Cable Fly - 2 x 10-15",
        "Middle Cable Fly - 2 x 10-15",
        "Low-to-High Cable Fly - 2 x 10-15",
      ],
      id: "chest-1",
      name: "Chest I",
      rotation: 1,
    },
    {
      exercises: [
        "Barbell Squat - warm-up, 3 x 5-8 heavy, then 2 x 10-15",
        "Leg Press - 4 x 8-12",
        "Leg Extension - 4 x 10-15 plus drop set",
        "Leg/Hamstring Curl - 4 x 10-15 plus drop set",
        "Standing Calf Raise - 4 x 10-15",
      ],
      id: "legs-1",
      name: "Legs I",
      rotation: 1,
    },
    {
      exercises: [
        "Overhead Barbell Press - warm-up, 3 x 8-12",
        "Seated Dumbbell Press - 3 x 8-12",
        "Lateral Raise - 4 x 10-15",
        "Single-Arm Cable Lateral Raise - 4 x 10-15",
        "Rear Delt Machine - 4 x 10-15",
        "Lat Pulldown - warm-up, 3 x 10-15",
        "Close-Grip Lat Pulldown - 3 x 10-15",
        "Half-Kneeling Single-Arm Lat Pulldown - 4 x 10-15",
        "Barbell Row - 3 x 8-12",
        "Dumbbell Row - 3 x 8-12",
        "Shrug - 4 x 10-15",
      ],
      id: "shoulders-back-1",
      name: "Shoulders & Back I",
      rotation: 1,
    },
    {
      exercises: [
        "Close-Grip Bench Press - 4 x 8-12",
        "Incline Cable Skullcrusher - 4 x 10-15",
        "Long-Rope Triceps Extension - 4 x 10-15",
        "Triceps Pushdown - 4 x 10-15; final set drop set",
        "Barbell Curl - 4 x 8-12",
        "Dumbbell Preacher Curl - 3 x 8-15",
        "Face-Away Cable Curl - 4 x 10-15",
        "Dumbbell Hammer Curl - 4 x 10-15",
        "Behind-the-Back Barbell Forearm Curl - 4 x 10-15",
      ],
      id: "arms-1",
      name: "Arms I",
      rotation: 1,
    },
    {
      exercises: [
        "Incline Barbell Bench Press - 4 x 8-15",
        "Incline Dumbbell Press - 3 x 8-15",
        "Pec Deck Fly - 4 x 10-15 or failure; final set drop set",
        "Chest Press Machine - 4 x 10-15 or failure; final set drop set",
        "Incline Bench Cable Fly - 4 x 8-12",
        "High-to-Low Cable Fly - 2 x 10-15",
        "Middle Cable Fly - 2 x 10-15",
        "Low-to-High Cable Fly - 2 x 10-15",
      ],
      id: "chest-2",
      name: "Chest II",
      rotation: 2,
    },
    {
      exercises: [
        "Hack Squat - 4 x 8-15",
        "Leg Press - 4 x 8-15",
        "Leg Extension - 4 x 10-15 plus drop set",
        "Leg/Hamstring Curl - 4 x 10-15 plus drop set",
        "Seated Calf Raise - 4 x 10-15",
      ],
      id: "legs-2",
      name: "Legs II",
      rotation: 2,
    },
    {
      exercises: [
        "Seated Dumbbell Press - 4 x 8-12",
        "Shoulder Press Machine - 3 x 8-15",
        "Lateral Raise - 4 x 10-15",
        "Single-Arm Cable Lateral Raise - 4 x 10-15",
        "Rear Delt Dumbbell Row - 4 x 10-15",
        "Rear Delt Machine - 2 x 10-15",
        "Wide-Grip T-Bar Row - 4 x 8-15",
        "Barbell Row - 4 x 8-15",
        "Hammer Strength Plate-Loaded Front Lat Pulldown - 4 x 8-15",
        "Single-Arm Cable Lat Pulldown - 4 x 10-15",
        "Cable Row - 4 x 10-15",
        "Shrug - 4 x 10-15",
      ],
      id: "shoulders-back-2",
      name: "Shoulders & Back II",
      rotation: 2,
    },
    {
      exercises: [
        "Close-Grip Bench Press - 4 x 8-12",
        "Incline Cable Skullcrusher - 4 x 10-15",
        "Long-Rope Triceps Extension - 4 x 10-15",
        "Triceps Pushdown - 4 x 10-15; final set drop set",
        "Barbell Curl - 4 x 8-12",
        "Spider, Incline, and Hammer Dumbbell Curl superset - 3 sets of 7 reps each",
        "Alternating Dumbbell Curl - 4 x 10-15",
        "Behind-the-Back Barbell Forearm Curl - 4 x 10-15",
      ],
      id: "arms-2",
      name: "Arms II",
      rotation: 2,
    },
  ] as const satisfies readonly ArchivedTrainingSession[],
  title: "Powerlifting & Bodybuilding Hypertrophy",
} as const;
