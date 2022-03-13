const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	MessageEmbed,
	MessageAttachment
} = require('discord.js');
const calendar = require(`../../../google`);

const monthIntegerArray = [
	['January', 0],
	['February', 1],
	['March', 2],
	['April', 3],
	['May', 4],
	['June', 5],
	['July', 6],
	['August', 7],
	['September', 8],
	['October', 9],
	['November', 10],
	['December', 11],
]

const hourIntegerArray = [];

for (i = 0; i <= 23; i++) {
	hourIntegerArray.push([`${i}`, i])
}

let title = null;
let description = null;
let start = null;
let end = null;
let eventWizardState = false;

function resetValues() {
	title = null;
	description = null;
	start = null;
	end = null;
	eventWizardState = false;
}

const checkState = async function (interaction, state, callback) {
	if (state) {
		callback(interaction)
	} else {
		interaction.reply({
			content: 'No ongoing event creation',
			ephemereal: true
		});
	}
}

const eventEmbed = new MessageEmbed()
	.setTitle(`Event Wizard`)
	.setAuthor({
		name: 'Calendar Bot',
		iconURL: 'https://i.pinimg.com/474x/55/e0/76/55e07698bca8e4aa1761121600c818e0.jpg'
	})
	.addFields({
		name: 'Title',
		value: 'use /event create'
	}, {
		name: 'Description',
		value: 'use /event description'
	}, {
		name: 'Start Time',
		value: 'use /event start',
		inline: true
	}, {
		name: 'End Time',
		value: 'use /event end',
		inline: true
	});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('event')
		.setDescription('Involves the events of the calendars')
		.addSubcommand(subcommand => subcommand.setName('create')
			.setDescription('Creates event creation wizard')
			.addStringOption(option => option.setName('title').setDescription('Event Title').setRequired(true))
		)
		.addSubcommand(subcommand => subcommand.setName('cancel')
			.setDescription('Cancels the current event creation wizard')
		)
		.addSubcommand(subcommand => subcommand.setName('review')
			.setDescription('Reviews the current event creation wizard')
		)
		.addSubcommand(subcommand => subcommand.setName('description')
			.setDescription('Sets the event description')
			.addStringOption(option => option.setName('description').setDescription('Event Desc.').setRequired(true))
		)
		.addSubcommand(subcommand => subcommand.setName('start')
			.setDescription('Sets the event start')
			.addIntegerOption(option => option.setName('month').setDescription('Event Start Month').setRequired(true).setChoices(monthIntegerArray))
			.addIntegerOption(option => option.setName('day').setDescription('Event Start Day').setRequired(true))
			.addIntegerOption(option => option.setName('year').setDescription('Event Start Year').setRequired(true))
			.addIntegerOption(option => option.setName('hour').setDescription('Event Start Hour').setChoices(hourIntegerArray))
			.addIntegerOption(option => option.setName('minute').setDescription('Event Start Minute'))
		)
		.addSubcommand(subcommand => subcommand.setName('end')
			.setDescription('Sets the event end')
			.addIntegerOption(option => option.setName('month').setDescription('Event Start Month').setRequired(true).setChoices(monthIntegerArray))
			.addIntegerOption(option => option.setName('day').setDescription('Event Start Day').setRequired(true))
			.addIntegerOption(option => option.setName('year').setDescription('Event Start Year').setRequired(true))
			.addIntegerOption(option => option.setName('hour').setDescription('Event Start Hour').setChoices(hourIntegerArray))
			.addIntegerOption(option => option.setName('minute').setDescription('Event Start Minute'))
		)
		.addSubcommand(subcommand => subcommand.setName('confirm')
			.setDescription('Add event to clendar')
		),
	async execute(interaction, client) {
		if (interaction.options.getSubcommand() === 'create') {

			if (!eventWizardState) { //Check if ongoing event wizard\

				eventWizardState = true; //Initiates event wizard

				title = interaction.options.getString('title')
				eventEmbed.spliceFields(0, 1, {
					name: 'Title',
					value: title
				})

				await interaction.reply({
					embeds: [eventEmbed],
					ephemereal: true
				});
			} else await interaction.reply({
				content: 'Ongoing event creation wizard (Use /event cancel to quit or /event review to complete)',
				ephemereal: true
			});

		} else if (interaction.options.getSubcommand() === 'cancel') {

			await checkState(interaction, eventWizardState, async () => {
				resetValues();
				await interaction.reply({
					content: 'Event creation cancelled',
					ephemereal: true
				})
			})

		} else if (interaction.options.getSubcommand() === 'review') {

			await checkState(interaction, eventWizardState, async () => {
				await interaction.reply({
					embeds: [eventEmbed],
					ephemereal: true
				})
			})

		} else if (interaction.options.getSubcommand() === 'description') {

			await checkState(interaction, eventWizardState, async () => {
				description = interaction.options.getString('description');
				eventEmbed.spliceFields(1, 1, {
					name: 'Description',
					value: description
				})
				await interaction.reply({
					embeds: [eventEmbed],
					ephemereal: true
				})
			})

		} else if (interaction.options.getSubcommand() === 'start') {
			await checkState(interaction, eventWizardState, async () => {
				const month = interaction.options.getInteger('month');
				const day = interaction.options.getInteger('day');
				const year = interaction.options.getInteger('year');
				const hour = interaction.options.getInteger('hour') || 0;
				const minute = interaction.options.getInteger('minute') || 0;

				start = new Date(year, month, day, hour, minute);
				let stringDate = start.toString();

				eventEmbed.spliceFields(2, 1, {
					name: 'Start Time',
					value: start.toString()
				});
				await interaction.reply({
					embeds: [eventEmbed],
					ephemereal: true
				});
			})
		} else if (interaction.options.getSubcommand() === 'end') {
			await checkState(interaction, eventWizardState, async () => {
				const month = interaction.options.getInteger('month');
				const day = interaction.options.getInteger('day');
				const year = interaction.options.getInteger('year');
				const hour = interaction.options.getInteger('hour') || 0;
				const minute = interaction.options.getInteger('minute') || 0;

				end = new Date(year, month, day, hour, minute);

				if (start > end) {
					await interaction.reply({
						content: `The date you inputted is earlier than the starting date. Please Try Again`,
						ephemereal: true
					})
				} else {
					let stringDate = end.toString();
					eventEmbed.spliceFields(3, 1, {
						name: 'End Time',
						value: end.toString()
					});
					await interaction.reply({
						embeds: [eventEmbed],
						ephemereal: true
					});
				}
			})
		} else if (interaction.options.getSubcommand() === 'confirm') {
			await checkState(interaction, eventWizardState, async () => {

				if (start && end) {

					const reportStart = start.toString();
					const reportEnd = end.toString();
					const reportEmbed = new MessageEmbed()
						.setTitle(title)
						.setDescription(description || '[UNDEFINED]')
						.addFields({
							name: 'Start Time',
							value: reportStart
						}, {
							name: 'End Time',
							value: reportEnd
						});

					await interaction.deferReply({
						ephemereal: true
					})

					calendar.addEvent(title, description, start, end).then(async () => {
						resetValues();
					})

					await interaction.editReply({
						content: `Succesfully inserted the event:`,
						embeds: [reportEmbed]
					})

				} else {
					await interaction.reply({
						content: `There are no valid dates inputted. Please try again`,
						ephemereal: true
					})
				}


			})
		}
	},
};