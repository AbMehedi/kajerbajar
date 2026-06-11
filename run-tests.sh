#!/bin/bash
# Quick test runner for KaajerBazar Phase 1

echo "🧪 KaajerBazar Phase 1 Test Suite"
echo "════════════════════════════════════════"
echo ""

# Check if dev server is running
echo "⏳ Checking for dev server on port 3000..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Dev server not running!"
    echo ""
    echo "🚀 Start the dev server first:"
    echo "   npm run dev"
    echo ""
    echo "Then run this command in another terminal:"
    echo "   npm run test:phase1"
    exit 1
fi

echo "✅ Dev server is running!"
echo ""

# Run tests
echo "🏃 Running all Phase 1 tests..."
echo ""
npm run test:phase1

test_exit_code=$?

echo ""
echo "════════════════════════════════════════"

if [ $test_exit_code -eq 0 ]; then
    echo "✅ All tests PASSED!"
    echo ""
    echo "🎉 Phase 1.1 is verified and ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Build Story 1.2 (Company verification)"
    echo "  2. Move to Phase 2 (Skill verification)"
    echo "  3. Start Phase 3 (Marketplace)"
else
    echo "❌ Some tests FAILED!"
    echo ""
    echo "📋 Troubleshooting:"
    echo "  • Check .env.local is configured"
    echo "  • Verify Supabase schema is applied"
    echo "  • Make sure dev server is running"
fi

exit $test_exit_code
