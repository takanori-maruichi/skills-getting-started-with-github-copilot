document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to default option to avoid duplicate entries on repeated fetch
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
  Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (bulleted list). show friendly message if none.
        const participants = details.participants || [];
        // Build participants section: no bullets, each item has a compact delete button
        const participantsHtml = participants.length
          ? `<div class="participants">
               <strong>Participants:</strong>
               <ul class="participants-list">
                 ${participants
                   .map(
                     (p) =>
                       `<li class="participant-item">` +
                       `<span class="participant-email">${p}</span>` +
                       `<button class="participant-delete" data-activity="${encodeURIComponent(
                         name
                       )}" data-email="${encodeURIComponent(p)}" title="Remove">&#128465;</button>` +
                       `</li>`
                   )
                   .join("")}
               </ul>
             </div>`
          : `<div class="participants">
               <strong>Participants:</strong>
               <p class="no-participants">No participants yet</p>
             </div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        // Attach delete handlers for each participant button
        // (use event delegation after appending to DOM)

        activitiesList.appendChild(activityCard);

        // After element is in the DOM, bind click handlers to delete buttons inside this card
        const deleteButtons = activityCard.querySelectorAll('.participant-delete');
        deleteButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const activityName = decodeURIComponent(btn.dataset.activity);
            const email = decodeURIComponent(btn.dataset.email);

            if (!confirm(`Remove ${email} from ${activityName}?`)) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                  email
                )}`,
                { method: 'DELETE' }
              );

              const json = await res.json();
              if (res.ok) {
                messageDiv.textContent = json.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                // Refresh activities list to reflect removal
                fetchActivities();
              } else {
                messageDiv.textContent = json.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }

              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly-registered participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
