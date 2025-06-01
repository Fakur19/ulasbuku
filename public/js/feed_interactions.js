// public/js/feed_interactions.js
document.addEventListener('DOMContentLoaded', () => {
    const commentToggleButtons = document.querySelectorAll('.comment-toggle-btn');

    commentToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const postId = button.dataset.postId;
            const commentsWrapper = document.getElementById(`comments-wrapper-${postId}`);

            if (commentsWrapper) {
                const isHidden = commentsWrapper.style.display === 'none' || commentsWrapper.style.display === '';
                if (isHidden) {
                    commentsWrapper.style.display = 'block';
                    // Optionally change button text/icon, e.g., "Hide Comments"
                    // For simplicity, we'll keep the button text static for now, or you can update it.
                    // Example: button.innerHTML = `🔼 Hide Comments (${button.dataset.commentCount || 0})`; 
                } else {
                    commentsWrapper.style.display = 'none';
                    // Example: button.innerHTML = `💬 Comments (${button.dataset.commentCount || 0})`;
                }
            }
        });
    });
});