// Training styles and their specific exercises
export const trainingStyles = [
  {
    id: "strength",
    title: "Strength Training",
    description: "Focus on building maximal strength with lower reps and higher weights",
    targetReps: "3-6",
    restTime: 180, // in seconds
    exercises: [
      {
        name: "Back Squat",
        targetMuscles: ["Quadriceps", "Glutes", "Lower Back"],
        sets: 5,
        reps: "5",
        defaultWeight: 130,
      },
      {
        name: "Deadlift",
        targetMuscles: ["Lower Back", "Hamstrings", "Glutes"],
        sets: 5,
        reps: "5",
        defaultWeight: 150,
      },
      {
        name: "Bench Press",
        targetMuscles: ["Chest", "Triceps", "Shoulders"],
        sets: 5,
        reps: "5",
        defaultWeight: 110,
      },
      {
        name: "Overhead Press",
        targetMuscles: ["Shoulders", "Triceps"],
        sets: 5,
        reps: "5",
        defaultWeight: 80,
      },
      {
        name: "Barbell Row",
        targetMuscles: ["Upper Back", "Biceps"],
        sets: 5,
        reps: "5",
        defaultWeight: 100,
      },
    ],
  },
  {
    id: "hypertrophy",
    title: "Hypertrophy",
    description: "Focus on muscle growth with moderate weights and higher volume",
    targetReps: "8-12",
    restTime: 90, // in seconds
    exercises: [
      {
        name: "Incline Dumbbell Press",
        targetMuscles: ["Upper Chest", "Shoulders", "Triceps"],
        sets: 4,
        reps: "10",
        defaultWeight: 60,
      },
      {
        name: "Lat Pulldown",
        targetMuscles: ["Lats", "Biceps"],
        sets: 4,
        reps: "12",
        defaultWeight: 120,
      },
      {
        name: "Leg Press",
        targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
        sets: 4,
        reps: "12",
        defaultWeight: 200,
      },
      {
        name: "Dumbbell Shoulder Press",
        targetMuscles: ["Shoulders", "Triceps"],
        sets: 4,
        reps: "10",
        defaultWeight: 50,
      },
      {
        name: "Romanian Deadlift",
        targetMuscles: ["Hamstrings", "Glutes", "Lower Back"],
        sets: 4,
        reps: "10",
        defaultWeight: 120,
      },
      {
        name: "Dumbbell Skullcrusher",
        targetMuscles: ["Triceps"],
        sets: 3,
        reps: "12",
        defaultWeight: 30,
      },
      {
        name: "Bicep Curl",
        targetMuscles: ["Biceps"],
        sets: 3,
        reps: "12",
        defaultWeight: 40,
      },
    ],
  },
  {
    id: "powerlifting",
    title: "Powerlifting",
    description: "Focus on the big three lifts: squat, bench, and deadlift",
    targetReps: "1-5",
    restTime: 240, // in seconds
    exercises: [
      {
        name: "Competition Squat",
        targetMuscles: ["Quadriceps", "Glutes", "Lower Back"],
        sets: 5,
        reps: "3",
        defaultWeight: 150,
      },
      {
        name: "Competition Bench Press",
        targetMuscles: ["Chest", "Triceps", "Shoulders"],
        sets: 5,
        reps: "3",
        defaultWeight: 120,
      },
      {
        name: "Competition Deadlift",
        targetMuscles: ["Lower Back", "Hamstrings", "Glutes"],
        sets: 5,
        reps: "3",
        defaultWeight: 180,
      },
      {
        name: "Pause Squat",
        targetMuscles: ["Quadriceps", "Glutes"],
        sets: 3,
        reps: "5",
        defaultWeight: 130,
      },
      {
        name: "Close-Grip Bench Press",
        targetMuscles: ["Triceps", "Chest"],
        sets: 3,
        reps: "5",
        defaultWeight: 100,
      },
    ],
  },
  {
    id: "olympic",
    title: "Olympic Weightlifting",
    description: "Focus on explosive power and technique with Olympic lifts",
    targetReps: "3-5",
    restTime: 180, // in seconds
    exercises: [
      {
        name: "Clean and Jerk",
        targetMuscles: ["Full Body", "Shoulders", "Quadriceps"],
        sets: 5,
        reps: "3",
        defaultWeight: 100,
      },
      {
        name: "Snatch",
        targetMuscles: ["Full Body", "Shoulders", "Traps"],
        sets: 5,
        reps: "3",
        defaultWeight: 80,
      },
      {
        name: "Front Squat",
        targetMuscles: ["Quadriceps", "Core"],
        sets: 4,
        reps: "5",
        defaultWeight: 120,
      },
      {
        name: "Push Press",
        targetMuscles: ["Shoulders", "Triceps"],
        sets: 4,
        reps: "5",
        defaultWeight: 90,
      },
      {
        name: "Hang Clean",
        targetMuscles: ["Traps", "Upper Back", "Quadriceps"],
        sets: 4,
        reps: "3",
        defaultWeight: 90,
      },
    ],
  },
  {
    id: "general",
    title: "General Fitness",
    description: "Balanced approach for overall fitness and health",
    targetReps: "8-15",
    restTime: 60, // in seconds
    exercises: [
      {
        name: "Goblet Squat",
        targetMuscles: ["Quadriceps", "Glutes"],
        sets: 3,
        reps: "12",
        defaultWeight: 50,
      },
      {
        name: "Dumbbell Bench Press",
        targetMuscles: ["Chest", "Triceps"],
        sets: 3,
        reps: "12",
        defaultWeight: 70,
      },
      {
        name: "Dumbbell Row",
        targetMuscles: ["Upper Back", "Biceps"],
        sets: 3,
        reps: "12",
        defaultWeight: 60,
      },
      {
        name: "Lateral Raise",
        targetMuscles: ["Shoulders"],
        sets: 3,
        reps: "15",
        defaultWeight: 30,
      },
      {
        name: "Plank",
        targetMuscles: ["Core", "Abs"],
        sets: 3,
        reps: "30s",
        defaultWeight: 0,
      },
      {
        name: "Lunges",
        targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
        sets: 3,
        reps: "10 each leg",
        defaultWeight: 40,
      },
    ],
  },
  {
    id: "athleticism",
    title: "Athleticism",
    description: "Focus on explosive power, agility, and sports performance",
    targetReps: "5-8",
    restTime: 120, // in seconds
    exercises: [
      {
        name: "Box Jump",
        targetMuscles: ["Quadriceps", "Calves"],
        sets: 4,
        reps: "6",
        defaultWeight: 0,
      },
      {
        name: "Medicine Ball Throw",
        targetMuscles: ["Core", "Chest", "Shoulders"],
        sets: 4,
        reps: "8",
        defaultWeight: 15,
      },
      {
        name: "Power Clean",
        targetMuscles: ["Full Body", "Traps", "Quadriceps"],
        sets: 4,
        reps: "5",
        defaultWeight: 100,
      },
      {
        name: "Depth Jump",
        targetMuscles: ["Quadriceps", "Calves"],
        sets: 4,
        reps: "6",
        defaultWeight: 0,
      },
      {
        name: "Kettlebell Swing",
        targetMuscles: ["Hamstrings", "Glutes", "Lower Back"],
        sets: 3,
        reps: "12",
        defaultWeight: 35,
      },
      {
        name: "Agility Ladder Drills",
        targetMuscles: ["Calves", "Coordination"],
        sets: 3,
        reps: "30s",
        defaultWeight: 0,
      },
    ],
  },
]

// Muscle groups and their associated exercises
export const muscleGroups = [
  {
    id: "chest",
    name: "Chest",
    exercises: ["Bench Press", "Incline Dumbbell Press", "Dumbbell Bench Press", "Push-Up", "Cable Fly"],
  },
  {
    id: "back",
    name: "Back",
    exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Pull-Up", "Dumbbell Row"],
  },
  {
    id: "legs",
    name: "Legs",
    exercises: ["Back Squat", "Leg Press", "Romanian Deadlift", "Lunges", "Leg Extension", "Leg Curl"],
  },
  {
    id: "shoulders",
    name: "Shoulders",
    exercises: ["Overhead Press", "Lateral Raise", "Front Raise", "Face Pull", "Dumbbell Shoulder Press"],
  },
  {
    id: "arms",
    name: "Arms",
    exercises: ["Bicep Curl", "Tricep Extension", "Hammer Curl", "Dumbbell Skullcrusher", "Tricep Pushdown"],
  },
  {
    id: "core",
    name: "Core",
    exercises: ["Plank", "Russian Twist", "Hanging Leg Raise", "Ab Rollout", "Cable Crunch"],
  },
]

// Workout logs structure
export const workoutLogsInitial = []

