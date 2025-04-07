// Example request from your Vue application
const startDate = '2025-03-01';
const endDate = '2025-04-01';

fetch(`/api/affluent/campaign-summary?start_date=${startDate}&end_date=${endDate}`)
  .then(response => response.json())
  .then(data => {
    console.log('Campaign Summary:', data);
    // Update your UI with the data
  })
  .catch(error => {
    console.error('Error fetching campaign summary:', error);
  });