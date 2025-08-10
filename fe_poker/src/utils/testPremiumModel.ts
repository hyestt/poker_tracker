// Test utility for Premium Model functionality
import RevenueCatService from '../services/RevenueCatService';

export const TestPremiumModel = {
  // Test quota system
  async testQuotaSystem() {
    console.log('🧪 Testing GTO Analysis Quota System...');
    
    try {
      // Reset quota first
      await RevenueCatService.resetGTOQuotaForTesting();
      
      // Check initial quota
      const initialQuota = await RevenueCatService.getGTOAnalysisQuota();
      console.log('📊 Initial quota:', initialQuota);
      
      // Test quota check
      const canUse1 = await RevenueCatService.canUseGTOAnalysis();
      console.log('✅ Can use analysis (first check):', canUse1);
      
      // Use analysis
      const used1 = await RevenueCatService.useGTOAnalysis();
      console.log('📈 Used analysis (first time):', used1);
      
      // Check quota after use
      const canUse2 = await RevenueCatService.canUseGTOAnalysis();
      console.log('❌ Can use analysis (after use):', canUse2);
      
      // Try to use again (should fail)
      const used2 = await RevenueCatService.useGTOAnalysis();
      console.log('🚫 Used analysis (second time - should fail):', used2);
      
      return {
        initialQuota,
        canUse1,
        used1,
        canUse2,
        used2,
      };
    } catch (error) {
      console.error('❌ Test failed:', error);
      return null;
    }
  },

  // Test premium status
  async testPremiumStatus() {
    console.log('🧪 Testing Premium Status...');
    
    try {
      // Test as free user
      await RevenueCatService.setTestPremiumStatus(false);
      const freeStatus = await RevenueCatService.canUseGTOAnalysis();
      console.log('🆓 Free user status:', freeStatus);
      
      // Test as premium user
      await RevenueCatService.setTestPremiumStatus(true);
      const premiumStatus = await RevenueCatService.canUseGTOAnalysis();
      console.log('💎 Premium user status:', premiumStatus);
      
      return {
        freeStatus,
        premiumStatus,
      };
    } catch (error) {
      console.error('❌ Test failed:', error);
      return null;
    }
  },

  // Reset all test data
  async resetTestData() {
    console.log('🔄 Resetting test data...');
    try {
      await RevenueCatService.resetGTOQuotaForTesting();
      await RevenueCatService.clearTestPremiumStatus();
      console.log('✅ Test data reset complete');
    } catch (error) {
      console.error('❌ Reset failed:', error);
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Premium Model Tests...');
    
    // Reset first
    await this.resetTestData();
    
    // Run tests
    const quotaTest = await this.testQuotaSystem();
    const premiumTest = await this.testPremiumStatus();
    
    console.log('📋 Test Results Summary:');
    console.log('- Quota System:', quotaTest ? '✅ PASS' : '❌ FAIL');
    console.log('- Premium Status:', premiumTest ? '✅ PASS' : '❌ FAIL');
    
    // Clean up
    await this.resetTestData();
    
    return {
      quotaTest,
      premiumTest,
    };
  }
};

// Global function for easy console testing
(global as any).testPremiumModel = TestPremiumModel;