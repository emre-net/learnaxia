import * as React from 'react';
import renderer from 'react-test-renderer';
import { Text, View } from 'react-native';

const DummyComponent = () => (
  <View>
    <Text>Learnaxia Mobile</Text>
  </View>
);

describe('Baseline Test', () => {
  it('renders correctly', () => {
    let tree;
    React.act(() => {
      tree = renderer.create(<DummyComponent />).toJSON();
    });
    expect(tree).toBeDefined();
  });
});
