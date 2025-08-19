import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

export class RevenueCatDebugger {
  
  static async printRevenueCatInfo(): Promise<void> {
    console.log('\n🔍 ================== RevenueCat Debug Info ==================');
    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('===============================================================\n');

    try {
      // 1. Check if RevenueCat is configured
      await this.checkConfiguration();
      
      // 2. Get and print customer info
      await this.printCustomerInfo();
      
      // 3. Get and print all offerings
      await this.printOfferings();
      
      // 4. Get and print products from each offering
      await this.printProducts();
      
      // 5. Test specific product IDs
      await this.testSpecificProducts();
      
    } catch (error: any) {
      console.error('❌ RevenueCat Debug failed:', {
        message: error.message,
        code: error.code,
        domain: error.domain,
        name: error.name,
        stack: error.stack
      });
    }
    
    console.log('\n🔍 ============== RevenueCat Debug Complete ================\n');
  }

  private static async checkConfiguration(): Promise<void> {
    console.log('🔧 Configuration Check:');
    try {
      const isAnonymous = await Purchases.isAnonymous();
      const appUserID = await Purchases.getAppUserID();
      
      console.log(`   ✅ Is Anonymous: ${isAnonymous}`);
      console.log(`   👤 App User ID: ${appUserID}`);
      console.log(`   🎯 Platform: ${Platform.OS}`);
    } catch (error: any) {
      console.error('   ❌ Configuration check failed:', error.message);
    }
    console.log('');
  }

  private static async printCustomerInfo(): Promise<void> {
    console.log('👤 Customer Information:');
    try {
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      
      console.log(`   📅 Original App User ID: ${customerInfo.originalAppUserId}`);
      console.log(`   🔗 Original Purchase Date: ${customerInfo.originalPurchaseDate}`);
      console.log(`   📧 Management URL: ${customerInfo.managementURL || 'None'}`);
      
      // Active entitlements
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      console.log(`   🎫 Active Entitlements (${activeEntitlements.length}):`);
      if (activeEntitlements.length > 0) {
        activeEntitlements.forEach(key => {
          const entitlement = customerInfo.entitlements.active[key];
          console.log(`      ✨ ${key}: ${entitlement.productIdentifier} (Active: ${entitlement.isActive})`);
        });
      } else {
        console.log('      📝 No active entitlements');
      }

      // All entitlements
      const allEntitlements = Object.keys(customerInfo.entitlements.all);
      console.log(`   📋 All Entitlements (${allEntitlements.length}):`);
      if (allEntitlements.length > 0) {
        allEntitlements.forEach(key => {
          const entitlement = customerInfo.entitlements.all[key];
          console.log(`      📄 ${key}: ${entitlement.productIdentifier} (Active: ${entitlement.isActive})`);
        });
      } else {
        console.log('      📝 No entitlements found');
      }

    } catch (error: any) {
      console.error('   ❌ Customer info failed:', error.message);
    }
    console.log('');
  }

  private static async printOfferings(): Promise<void> {
    console.log('🛍️ Offerings Information:');
    try {
      const offerings = await Purchases.getOfferings();
      
      console.log(`   📦 Total Offerings: ${Object.keys(offerings.all).length}`);
      console.log(`   🎯 Current Offering: ${offerings.current?.identifier || 'None'}`);
      
      if (Object.keys(offerings.all).length === 0) {
        console.log('   ⚠️  No offerings found!');
        console.log('   💡 This might be because:');
        console.log('      - Products not approved in App Store Connect');
        console.log('      - RevenueCat not synced with App Store Connect');
        console.log('      - API key configuration issue');
        return;
      }
      
      Object.keys(offerings.all).forEach(key => {
        const offering = offerings.all[key];
        console.log(`\n   📋 Offering: "${key}"`);
        console.log(`      🏷️  Identifier: ${offering.identifier}`);
        console.log(`      📝 Description: ${offering.serverDescription}`);
        console.log(`      📦 Packages: ${offering.availablePackages.length}`);
        
        offering.availablePackages.forEach((pkg, index) => {
          console.log(`         ${index + 1}. ${pkg.identifier}`);
          console.log(`            💰 Price: ${pkg.product.priceString}`);
          console.log(`            🔖 Product ID: ${pkg.product.identifier}`);
          console.log(`            📋 Title: ${pkg.product.title}`);
          console.log(`            📄 Description: ${pkg.product.description}`);
          if (pkg.product.subscriptionPeriod) {
            console.log(`            ⏰ Period: ${pkg.product.subscriptionPeriod}`);
          }
        });
      });
      
    } catch (error: any) {
      console.error('   ❌ Offerings failed:', error.message);
      console.log('   🔍 Error details:', {
        code: error.code,
        domain: error.domain,
        userInfo: error.userInfo
      });
    }
    console.log('');
  }

  private static async printProducts(): Promise<void> {
    console.log('🏷️ Individual Products Check:');
    
    const expectedProducts = [
      '$rc_monthly',
      '$rc_annual'
    ];
    
    for (const productId of expectedProducts) {
      console.log(`\n   🔍 Checking Product: ${productId}`);
      try {
        // Try to find this product in offerings
        const offerings = await Purchases.getOfferings();
        let found = false;
        
        Object.values(offerings.all).forEach(offering => {
          offering.availablePackages.forEach(pkg => {
            if (pkg.product.identifier === productId) {
              found = true;
              console.log(`      ✅ Found in offering: ${offering.identifier}`);
              console.log(`      💰 Price: ${pkg.product.priceString}`);
              console.log(`      📋 Title: ${pkg.product.title}`);
              console.log(`      📦 Package ID: ${pkg.identifier}`);
            }
          });
        });
        
        if (!found) {
          console.log(`      ❌ Product NOT found in any offering`);
          console.log(`      💡 Check App Store Connect product status`);
        }
        
      } catch (error: any) {
        console.error(`      ❌ Error checking product:`, error.message);
      }
    }
    console.log('');
  }

  private static async testSpecificProducts(): Promise<void> {
    console.log('🧪 Product Availability Test:');
    
    try {
      const offerings = await Purchases.getOfferings();
      const allProducts = Object.values(offerings.all).flatMap(offering => 
        offering.availablePackages.map(pkg => pkg.product.identifier)
      );
      
      console.log(`   📊 Total Products Available: ${allProducts.length}`);
      console.log(`   📋 Product List:`);
      allProducts.forEach((productId, index) => {
        console.log(`      ${index + 1}. ${productId}`);
      });
      
      const expectedProducts = [
        '$rc_monthly',
        '$rc_annual'
      ];
      
      console.log(`\n   🎯 Expected Products Check:`);
      expectedProducts.forEach(expectedId => {
        const found = allProducts.includes(expectedId);
        console.log(`      ${found ? '✅' : '❌'} ${expectedId}: ${found ? 'Available' : 'Missing'}`);
      });
      
      // Check for old product IDs
      const oldProducts = [
        'com.livehand.pro.monthly',
        'com.livehand.pro.annual'
      ];
      
      console.log(`\n   🔍 Old Product IDs Check:`);
      oldProducts.forEach(oldId => {
        const found = allProducts.includes(oldId);
        if (found) {
          console.log(`      ⚠️  ${oldId}: Still present (should be removed)`);
        } else {
          console.log(`      ✅ ${oldId}: Correctly removed`);
        }
      });
      
    } catch (error: any) {
      console.error('   ❌ Product test failed:', error.message);
    }
    console.log('');
  }

  // Quick debug method for settings screen
  static async quickDebug(): Promise<{ 
    hasOfferings: boolean; 
    offeringsCount: number; 
    productsCount: number; 
    expectedProducts: string[];
    availableProducts: string[];
    error?: string;
  }> {
    try {
      const offerings = await Purchases.getOfferings();
      const allProducts = Object.values(offerings.all).flatMap(offering => 
        offering.availablePackages.map(pkg => pkg.product.identifier)
      );
      
      const expectedProducts = [
        '$rc_monthly',
        '$rc_annual'
      ];
      
      return {
        hasOfferings: Object.keys(offerings.all).length > 0,
        offeringsCount: Object.keys(offerings.all).length,
        productsCount: allProducts.length,
        expectedProducts,
        availableProducts: allProducts,
      };
    } catch (error: any) {
      return {
        hasOfferings: false,
        offeringsCount: 0,
        productsCount: 0,
        expectedProducts: [],
        availableProducts: [],
        error: error.message
      };
    }
  }
}

// Usage example:
// import { RevenueCatDebugger } from '../utils/revenueCatDebugger';
// 
// In your component:
// const debugRevenueCat = async () => {
//   await RevenueCatDebugger.printRevenueCatInfo();
// };
//
// For quick check:
// const quickCheck = async () => {
//   const result = await RevenueCatDebugger.quickDebug();
//   console.log('Quick debug result:', result);
// };