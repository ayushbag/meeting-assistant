import { classifyMeeting } from './classifier.js';

const transcript = `
// [00:00] Speaker 1: Today we'll discuss the Q3 roadmap.

// [00:10] Speaker 2: Engineering can finish the migration this month.

// [00:20] Speaker 1: Should we launch this quarter?

// [00:30] Speaker 3: We need to decide the launch date and assign owners.
// `;

// // lecture
// const transcript = `
// Today we are going to learn binary search.
// Binary search works by repeatedly dividing the search space in half.
// The time complexity of binary search is O(log n).
// `;

// // interview
// const transcript = `
// Interviewer: Explain how a hash map works.
// Candidate: It stores key-value pairs and uses a hash function...
// Interviewer: What is the average lookup complexity?
// Candidate: O(1).
// `;

const result = await classifyMeeting(transcript);

console.dir(result, { depth: null });
