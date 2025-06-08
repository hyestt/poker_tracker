import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GTOAnalysis, GTOStage, GTOAction } from '../models';
import { theme } from '../theme';

interface GTOVisualizationProps {
  gtoData: GTOAnalysis;
}

interface StageVisualizationProps {
  title: string;
  stage: GTOStage;
}

const ActionBar: React.FC<{ action: GTOAction; maxFrequency: number }> = ({ action, maxFrequency }) => {
  const widthPercentage = maxFrequency > 0 ? (action.frequency / maxFrequency) * 100 : 0;
  
  const getActionColor = (actionType: string): string => {
    switch (actionType.toLowerCase()) {
      case 'check': return '#4CAF50';
      case 'call': return '#2196F3';
      case 'bet33': return '#FF9800';
      case 'bet50': return '#FF5722';
      case 'bet75': return '#E91E63';
      case 'bet100': return '#9C27B0';
      case 'overbet': return '#F44336';
      case 'fold': return '#757575';
      case 'raise': return '#FF6B35';
      default: return '#607D8B';
    }
  };

  return (
    <View style={styles.actionContainer}>
      <View style={styles.actionHeader}>
        <Text style={styles.actionText}>{action.action}</Text>
        <Text style={styles.frequencyText}>{action.frequency}%</Text>
      </View>
      <View style={styles.barContainer}>
        <View 
          style={[
            styles.bar, 
            { 
              width: `${widthPercentage}%`,
              backgroundColor: getActionColor(action.action)
            }
          ]} 
        />
      </View>
    </View>
  );
};

const StageVisualization: React.FC<StageVisualizationProps> = ({ title, stage }) => {
  const maxFrequency = Math.max(...stage.actions.map(action => action.frequency), 1);
  
  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>{title}</Text>
      <Text style={styles.stageSummary}>{stage.summary}</Text>
      
      <View style={styles.actionsContainer}>
        {stage.actions
          .filter(action => action.frequency > 0)
          .sort((a, b) => b.frequency - a.frequency)
          .map((action, index) => (
            <ActionBar 
              key={`${title}-${action.action}-${index}`}
              action={action} 
              maxFrequency={maxFrequency} 
            />
          ))}
      </View>
    </View>
  );
};

export const GTOVisualization: React.FC<GTOVisualizationProps> = ({ gtoData }) => {
  const stages = [
    { title: 'Preflop', stage: gtoData.preflop },
    { title: 'Flop', stage: gtoData.flop },
    { title: 'Turn', stage: gtoData.turn },
    { title: 'River', stage: gtoData.river },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>GTO Analysis</Text>
      
      {stages.map(({ title, stage }) => (
        <StageVisualization 
          key={title}
          title={title}
          stage={stage}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  stageContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  stageSummary: {
    fontSize: 14,
    color: theme.colors.gray,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  actionsContainer: {
    gap: theme.spacing.sm,
  },
  actionContainer: {
    marginBottom: theme.spacing.sm,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  barContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});

export default GTOVisualization; 