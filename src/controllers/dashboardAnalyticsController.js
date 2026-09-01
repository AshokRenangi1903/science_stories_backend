import {prisma} from "../config/db.js"
// Get Dashboard Analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalEras,
      totalStories,
      totalQuizzes,
      publishedStories,
      popularStories,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.era.count(),

      prisma.story.count(),

      prisma.quiz.count(),

      prisma.story.count({
        where: {
          isPublished: true,
        },
      }),

      prisma.story.count({
        where: {
          isPopular: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEras,
        totalStories,
        totalQuizzes,
        publishedStories,
        popularStories,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message,
    });
  }
};

export { getDashboardAnalytics };
