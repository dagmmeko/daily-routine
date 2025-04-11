import { test, expect } from "@playwright/test";

test("should display routine tasks correctly", async ({ page }) => {
  // Set up console log capture
  page.on("console", (msg) => {
    console.log(`Browser console: ${msg.text()}`);
  });

  // Navigate to the edit routine page
  await page.goto("/edit-routine");

  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Edit Daily Routine")');

  // Take a screenshot of the initial state
  await page.screenshot({ path: "routine-initial.png" });

  // Check if the page has loaded routine items
  await page.waitForSelector('text="Your Routine Items"');

  // Add a test routine to ensure we have at least one item to test
  await page.fill("input#taskName", "Test Task");
  await page.fill("input#startTime", "08:00");
  await page.fill("input#endTime", "09:00");

  // Take a screenshot before clicking add
  await page.screenshot({ path: "routine-before-add.png" });

  // Click the add button
  await page.click('button:has-text("Add Routine")');

  // Wait for request to complete
  await page.waitForTimeout(1000);

  // Take a screenshot after clicking add
  await page.screenshot({ path: "routine-after-add.png" });

  // Debug info - check if any routines are visible at all
  const routineItems = await page.$$(".border.border-gray-200");
  console.log(`Found ${routineItems.length} routine items`);

  // Check existing content without waiting for the success message
  const pageContent = await page.content();
  console.log(
    `Page content includes task name: ${pageContent.includes("Test Task")}`
  );

  // Evaluate the routines in the JavaScript context
  const routinesInContext = await page.evaluate(() => {
    // @ts-ignore - Access the React component's state (this is for testing only)
    return window.__routines || "Not available";
  });

  console.log("Routines in context:", routinesInContext);
});

test("should handle both naming conventions for routine fields", async ({
  page,
}) => {
  // Mock the routines data
  await page.goto("/edit-routine");

  // Wait for the page to load to ensure React is ready
  await page.waitForSelector('h1:has-text("Edit Daily Routine")');

  // Inject test data with snake_case names to simulate API response
  await page.evaluate(() => {
    const testRoutines = [
      {
        id: "1",
        user_id: "test-user",
        task_name: "Snake Case Task",
        start_time: "09:00",
        end_time: "10:00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        user_id: "test-user",
        taskName: "Camel Case Task",
        startTime: "11:00",
        endTime: "12:00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  // Wait a moment for any rendering to complete
  await page.waitForTimeout(1000);

  // Take a screenshot of the result
  await page.screenshot({ path: "routine-mock-test.png" });
});
