// Workout categories and exercises
export const workoutCategories = [
    {
      id: "strength",
      title: "Strength Training",
      icon: "barbell",
      color: "#FF5733",
      description: "Build muscle and increase strength with these workouts",
      workouts: [
        {
          id: "chest-day",
          title: "Chest Day",
          duration: "45 min",
          difficulty: "Intermediate",
          exercises: [
            { name: "Bench Press", sets: 4, reps: "8-10", rest: "90 sec" },
            { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "60 sec" },
            { name: "Cable Flyes", sets: 3, reps: "12-15", rest: "60 sec" },
            { name: "Push-ups", sets: 3, reps: "To failure", rest: "60 sec" },
          ],
        },
        {
          id: "leg-day",
          title: "Leg Day",
          duration: "50 min",
          difficulty: "Advanced",
          exercises: [
            { name: "Squats", sets: 4, reps: "8-10", rest: "120 sec" },
            { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90 sec" },
            { name: "Leg Press", sets: 3, reps: "12-15", rest: "90 sec" },
            { name: "Walking Lunges", sets: 3, reps: "16 steps", rest: "60 sec" },
            { name: "Calf Raises", sets: 4, reps: "15-20", rest: "45 sec" },
          ],
        },
      ],
    },
    {
      id: "cardio",
      title: "Cardio",
      icon: "heart",
      color: "#33A1FF",
      description: "Improve endurance and burn calories",
      workouts: [
        {
          id: "hiit",
          title: "HIIT Session",
          duration: "30 min",
          difficulty: "Intermediate",
          exercises: [
            { name: "Jumping Jacks", time: "45 sec", rest: "15 sec" },
            { name: "Mountain Climbers", time: "45 sec", rest: "15 sec" },
            { name: "Burpees", time: "45 sec", rest: "15 sec" },
            { name: "High Knees", time: "45 sec", rest: "15 sec" },
            { name: "Rest", time: "60 sec", rest: "0 sec" },
            { name: "Repeat 3 more times", time: "", rest: "" },
          ],
        },
        {
          id: "steady-state",
          title: "Steady State Cardio",
          duration: "45 min",
          difficulty: "Beginner",
          exercises: [{ name: "Treadmill (moderate pace)", time: "45 min", rest: "0 sec" }],
        },
      ],
    },
    {
      id: "flexibility",
      title: "Flexibility",
      icon: "body",
      color: "#33FF99",
      description: "Improve range of motion and prevent injuries",
      workouts: [
        {
          id: "full-stretch",
          title: "Full Body Stretch",
          duration: "20 min",
          difficulty: "Beginner",
          exercises: [
            { name: "Hamstring Stretch", time: "60 sec per side", rest: "0 sec" },
            { name: "Quad Stretch", time: "60 sec per side", rest: "0 sec" },
            { name: "Shoulder Stretch", time: "60 sec per side", rest: "0 sec" },
            { name: "Cat-Cow Stretch", time: "60 sec", rest: "0 sec" },
            { name: "Child's Pose", time: "60 sec", rest: "0 sec" },
          ],
        },
      ],
    },
  ]
  
  // User's workout history
  export const workoutHistory = [
    {
      id: "1",
      date: "2023-11-15",
      workout: "Chest Day",
      duration: "48 min",
      calories: 320,
    },
    {
      id: "2",
      date: "2023-11-13",
      workout: "HIIT Session",
      duration: "32 min",
      calories: 380,
    },
    {
      id: "3",
      date: "2023-11-10",
      workout: "Leg Day",
      duration: "55 min",
      calories: 450,
    },
  ]
  
  