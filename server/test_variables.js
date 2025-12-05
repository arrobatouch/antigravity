// Test script para verificar que las variables funcionan
const db = require('./db');

console.log('🔵 Testing variables...');

try {
    // Test 1: Get variables
    console.log('\n1️⃣ Getting variables for tenant_default:');
    const variables = db.getVariables('tenant_default');
    console.log(`✅ Found ${variables.length} variables`);
    console.log('First 3 variables:', variables.slice(0, 3).map(v => v.name));

    // Test 2: Create variable
    console.log('\n2️⃣ Creating test variable:');
    const newVar = db.createVariable('tenant_default', {
        name: 'test_variable',
        type: 'contact',
        description: 'Variable de prueba',
        askIfMissing: true,
        askMessage: '¿Test?'
    });
    console.log('✅ Variable created:', newVar.id, newVar.name);

    // Test 3: Get variables again
    console.log('\n3️⃣ Getting variables again:');
    const variables2 = db.getVariables('tenant_default');
    console.log(`✅ Now have ${variables2.length} variables`);

    // Test 4: Delete test variable
    console.log('\n4️⃣ Deleting test variable:');
    db.deleteVariable('tenant_default', newVar.id);
    console.log('✅ Variable deleted');

    // Test 5: Final count
    console.log('\n5️⃣ Final count:');
    const variables3 = db.getVariables('tenant_default');
    console.log(`✅ Back to ${variables3.length} variables`);

    console.log('\n✅ All tests passed!');
} catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
}
