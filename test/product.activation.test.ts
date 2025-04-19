/**
 * Complete activation process test
 * Shows how to request a number, wait for SMS code,
 * and cancel the order if code is not received in 120 seconds
 */

import { productApi, GetNumberV2Params, ActivationStatus } from '../src/modules/products/external';
import axios, { AxiosResponse } from 'axios';
import { env } from '../src/config/env';

/**
 * Main test function
 */
async function testFullActivationProcess() {
  console.log('=== STARTING FULL ACTIVATION PROCESS TEST ===');
  
  // Get API credentials from environment
  const apiKey = env.smsActivate.apiKey;
  const apiUrl = env.smsActivate.apiUrl;
  
  if (!apiKey || !apiUrl) {
    console.error('ERROR: API credentials not found in environment variables');
    return;
  }
  
  try {
    // Create unique order ID
    const orderId = `test_order_${Date.now()}`;
    
    // Request parameters
    const params: GetNumberV2Params = {
      service: 'wa',       // WhatsApp service
      country: 6,          // Indonesia country code
      orderId: orderId,    // Unique order ID
    };
    
    console.log('Request parameters:');
    console.log(JSON.stringify(params, null, 2));
    
    // Step 1: Request activation number
    console.log('\n=== STEP 1: REQUEST ACTIVATION NUMBER ===');
    
    let activationId: number;
    let phoneNumber: string;
    let rawActivationResponse: any;
    
    try {
      // Direct API call to get raw response
      const requestUrl = `${apiUrl}?api_key=${apiKey}&action=getNumberV2&service=${params.service}&country=${params.country}&orderId=${params.orderId}`;
      console.log(`Sending request to: ${requestUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      const response: AxiosResponse = await axios.get(requestUrl);
      rawActivationResponse = response.data;
      
      console.log('\nRaw API response:');
      console.log(JSON.stringify(rawActivationResponse, null, 2));
      
      // Extract activation ID and phone number from response
      if (typeof rawActivationResponse === 'object' && rawActivationResponse.activationId) {
        activationId = rawActivationResponse.activationId;
        phoneNumber = rawActivationResponse.phoneNumber;
        
        console.log(`\n✅ Activation number received:`);
        console.log(`📱 Phone number: ${phoneNumber}`);
        console.log(`🆔 Activation ID: ${activationId}`);
      } else {
        throw new Error(`Invalid response format: ${JSON.stringify(rawActivationResponse)}`);
      }
    } catch (error) {
      console.error('❌ Error requesting activation number:', error);
      return;
    }
    
    // Step 2: Wait for SMS code with timeout
    console.log('\n=== STEP 2: WAIT FOR SMS CODE ===');
    console.log(`⏳ Checking activation status for ID ${activationId} for exactly 120 seconds...`);
    
    // Start waiting time
    const startWaitingTime = Date.now();
    const timeoutMs = 120 * 1000; // 120 seconds in milliseconds
    const checkIntervalMs = 10000; // Check every 10 seconds
    
    // Function to check status periodically
    const checkForSmsCode = async (): Promise<{code: string | null, rawResponses: any[]}> => {
      return new Promise(async (resolve) => {
        // Variables to store code and raw responses
        let smsCode: string | null = null;
        const rawResponses: any[] = [];
        
        // Function to check status in each iteration
        const checkStatus = async () => {
          try {
            // Direct API call to get raw response
            const requestUrl = `${apiUrl}?api_key=${apiKey}&action=getStatus&id=${activationId}`;
            
            const response: AxiosResponse = await axios.get(requestUrl);
            const rawData = response.data;
            
            // Store raw response
            rawResponses.push(rawData);
            
            // Display status and elapsed time
            const currentTime = new Date().toLocaleTimeString();
            const elapsedSeconds = Math.floor((Date.now() - startWaitingTime) / 1000);
            console.log(`[${currentTime}] Status check (${elapsedSeconds}s): ${rawData}`);
            
            if (typeof rawData === 'string' && rawData.startsWith(ActivationStatus.OK)) {
              // Code received - format: STATUS_OK:123456
              smsCode = rawData.split(':')[1];
              console.log(`\n🎉 SMS CODE RECEIVED: ${smsCode}`);
              return true;
            }
            
            // Check timeout
            const elapsedMs = Date.now() - startWaitingTime;
            if (elapsedMs >= timeoutMs) {
              console.log(`\n⏰ TIMEOUT REACHED: ${timeoutMs/1000} seconds elapsed`);
              return true;
            }
            
            return false;
          } catch (error) {
            console.error('Error checking status:', error);
            return false;
          }
        };
        
        // Set interval for periodic checking
        const intervalId = setInterval(async () => {
          const shouldStop = await checkStatus();
          if (shouldStop) {
            clearInterval(intervalId);
            resolve({code: smsCode, rawResponses});
          }
        }, checkIntervalMs);
        
        // First immediate check
        const shouldStop = await checkStatus();
        if (shouldStop) {
          clearInterval(intervalId);
          resolve({code: smsCode, rawResponses});
        }
      });
    };
    
    // Wait for SMS code
    const {code: smsCode, rawResponses} = await checkForSmsCode();
    
    // Step 3: Take action based on result
    console.log('\n=== STEP 3: TAKE ACTION BASED ON RESULT ===');
    
    if (smsCode) {
      // If code received, complete activation
      console.log(`✅ Activation successful. Received code: ${smsCode}`);
      console.log('Setting activation as completed...');
      
      try {
        // Direct API call to set status
        const requestUrl = `${apiUrl}?api_key=${apiKey}&action=setStatus&id=${activationId}&status=6`;
        const response = await axios.get(requestUrl);
        const rawData = response.data;
        
        console.log('Raw API response:');
        console.log(rawData);
        
        console.log('✅ Activation completed successfully');
      } catch (error) {
        console.error('❌ Error completing activation:', error);
      }
    } else {
      // If no code received, cancel activation
      console.log('⚠️ SMS CODE NOT RECEIVED WITHIN 120 SECONDS');
      console.log('Cancelling activation...');
      
      try {
        // Direct API call to cancel
        const requestUrl = `${apiUrl}?api_key=${apiKey}&action=setStatus&id=${activationId}&status=8`;
        const response = await axios.get(requestUrl);
        const rawData = response.data;
        
        console.log('Raw API response:');
        console.log(rawData);
        
        console.log('✅ Activation cancelled successfully');
      } catch (error) {
        console.error('❌ Error cancelling activation:', error);
      }
    }
    
    // Summary of raw responses
    console.log('\n=== ALL RAW STATUS RESPONSES ===');
    rawResponses.forEach((response, index) => {
      console.log(`Status check #${index + 1}: ${response}`);
    });
    
    console.log('\n✅ TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
}

// Run test
testFullActivationProcess()
  .then(() => console.log('✅ Test execution finished'))
  .catch(error => console.error('❌ Fatal error:', error));