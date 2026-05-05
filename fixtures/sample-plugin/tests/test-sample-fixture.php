<?php
class SampleFixturePluginTest extends WP_UnitTestCase {
    public function test_label(): void {
        $this->assertSame('sample-fixture', sample_fixture_plugin_label());
    }
}
