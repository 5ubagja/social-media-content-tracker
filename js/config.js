/**
 * Configuration file for Social Media Content Tracker
 * 
 * IMPORTANT: Update the API_URL after deploying Google Apps Script
 */

const CONFIG = {
    // Replace this with your Google Apps Script Web App URL
    // After deploying, it will look like:
    // https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec
    API_URL: 'https://script.google.com/macros/s/AKfycbzC-2PNkPg5bFftOSMtYoS1pXUX3v3S4DSpfzTfZDy7raIakAYN34uQf3q9da3MIZEwdA/exec',

    // Post types available
    POST_TYPES: [
        'IGPOST',
        'IGREELS',
        'IGSTORY',
        'TIKTOK',
        'YOUTUBE',
        'TWITTER',
        'FACEBOOK',
        'OTHER'
    ],

    // Default employees (can be customized)
    EMPLOYEES: [
        '@bila',
        '@admin',
        '@user'
    ],

    // Default accounts being managed
    DEFAULT_ACCOUNTS: [
        '@74karta',
        '@bandung.banget',
        '@ceramah.berfaedah',
        '@feed_bandung'
    ]
};
